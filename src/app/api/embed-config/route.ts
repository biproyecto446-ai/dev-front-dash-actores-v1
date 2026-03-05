import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

function getAzureCredentials() {
  return {
    tenantId: process.env.TENANT_ID ?? process.env.AZURE_TENANT_ID,
    clientId: process.env.CLIENT_ID ?? process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET ?? process.env.AZURE_CLIENT_SECRET,
  };
}

async function getAzureAccessToken(): Promise<string> {
  const { tenantId, clientId, clientSecret } = getAzureCredentials();
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Faltan credenciales Azure AD (TENANT_ID, CLIENT_ID, CLIENT_SECRET)');
  }
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
    }).toString(),
  });
  if (!res.ok) throw new Error(`Azure AD token: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const bearer = request.headers.get('authorization')?.startsWith('Bearer ')
    ? request.headers.get('authorization')!.slice(7).trim()
    : null;
  const appToken = process.env.APP_ACCESS_TOKEN?.trim();
  const authorized = session || (appToken && bearer === appToken);
  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
  }

  const reportId = process.env.REPORT_ID ?? process.env.POWER_BI_REPORT_ID;
  const workspaceId = process.env.WORKSPACE_ID ?? process.env.POWER_BI_WORKSPACE_ID;
  if (!reportId) {
    return NextResponse.json({ error: 'REPORT_ID no configurado' }, { status: 500 });
  }

  try {
    const accessToken = await getAzureAccessToken();
    const embedUrl = workspaceId
      ? `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`
      : `https://app.powerbi.com/reportEmbed?reportId=${reportId}`;
    const tokenUrl = workspaceId
      ? `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`
      : `https://api.powerbi.com/v1.0/myorg/reports/${reportId}/GenerateToken`;

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessLevel: 'View' }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json(
        { error: 'Error al generar token Power BI', detail: text },
        { status: tokenRes.status }
      );
    }
    const tokenData = (await tokenRes.json()) as { token: string; expiration: string };
    return NextResponse.json({
      embedUrl,
      accessToken: tokenData.token,
      reportId,
      expiration: tokenData.expiration,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener embed', detail: message }, { status: 500 });
  }
}
