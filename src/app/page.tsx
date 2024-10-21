import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import queryString from "query-string";

function makeid(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export default function Home() {
  const cookieStore = cookies();
  const [spotifyToken, spotifyRefresh] = [
    cookieStore.get("SPOTIFY_TOKEN"),
    cookieStore.get("SPOTIFY_REFRESH"),
  ];
  async function spotifyLogin(formData: FormData) {
    "use server";

    const state = makeid(16);
    const scope =
      "user-read-private user-read-email user-read-currently-playing user-read-playback-state";
    const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    return redirect(
      "https://accounts.spotify.com/authorize?" +
        queryString.stringify({
          response_type: "code",
          client_id: spotifyClientId,
          scope,
          redirect_uri: "http://localhost:3000/api/callback",
          state,
        })
    );
  }

  async function spotifyUpdate(formData: FormData) {
    "use server";
    const rawData = {
      username: formData.get("username"),
      password: formData.get("password"),
    };
    const token = cookies().get("SPOTIFY_TOKEN");

    if (!token) {
      return redirect("/?error=MISSING_TOKEN");
    }
    const songData = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })
      .then((res) => res.json())
      .catch((res) => redirect("/?error=NOTHING_PLAYING"));

    const songName = songData.item.name;
    const author = songData.item.artists[0].name;

    await fetch("http://127.0.0.1:8000/update_bio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: songName,
        author,
        username: rawData.username,
        password: rawData.password,
      }),
    })
      .then((res) => res.json())
      .then(console.log);

    return redirect("/?success=TRUE");
  }

  if (spotifyToken && spotifyRefresh) {
    return (
      <div>
        <form action={spotifyUpdate} className="mt-6 w-72 mx-auto">
          <div className="w-full">
            <input type="text" name="username" className="p-2 rounded w-full" />
          </div>
          <div className="mt-2 w-full">
            <input
              type="password"
              name="password"
              className="p-2 rounded w-full"
            />
          </div>
          <div className="mt-4 w-full">
            <p className="p-2 bg-white text-black mb-2">Login with instagram</p>
            <button type="submit" className="bg-lime-600 rounded w-full p-2">
              Update Status
            </button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div>
      <form className="mt-6 w-72 mx-auto" action={spotifyLogin}>
        <div className="flex flex-col justify-center items-center">
          <div className="mt-4 w-full">
            <button type="submit" className="bg-lime-600 rounded w-full p-2">
              Login with spotify
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
