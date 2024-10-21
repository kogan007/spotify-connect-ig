import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || null;
  const state = request.nextUrl.searchParams.get("state") || null;

  if (!spotifyClientId || !spotifyClientSecret) {
    return redirect("/?error=MISSING_VARS");
  }
  if (state === null) {
    return redirect("/");
  } else {
    const buff = Buffer.from(spotifyClientId + ":" + spotifyClientSecret);

    const form: Record<string, any> = {
      code,
      redirect_uri: "http://localhost:3000/api/callback",
      grant_type: "authorization_code",
    };

    const params = new URLSearchParams();
    for (let key in form) {
      params.append(key, form[key]);
    }

    const data: TokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + buff.toString("base64"),
        },
        body: params,
      }
    ).then((res) => res.json());

    cookies().set({
      name: "SPOTIFY_TOKEN",
      value: data.access_token,
      maxAge: data.expires_in,
    });

    cookies().set({
      name: "SPOTIFY_REFRESH",
      value: data.refresh_token,
      maxAge: data.expires_in,
    });

    return redirect("/");
  }
}
