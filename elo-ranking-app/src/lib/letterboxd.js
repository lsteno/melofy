import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
/**
 * Imports movies from a Letterboxd RSS feed and creates a new list in Supabase.
 * @param {string} letterboxdUsername - The Letterboxd username.
 */
async function importLetterboxdMovies(letterboxdUsername) {


  // Construct the RSS feed URL.
  const rssUrl = `https://letterboxd.com/${letterboxdUsername}/rss/`;

  try {
    // Fetch the RSS feed.
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    const rssText = await response.text();

    // Parse the XML RSS feed.
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "application/xml");
    const items = xmlDoc.querySelectorAll("item");

    if (!items.length) {
      console.warn("No movies found in the feed.");
      return;
    }

    // Create a new list row in the "lists" table.
    // You can customize the title and description as needed.
    const listTitle = `Letterboxd Import - ${letterboxdUsername}`;
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .insert([{
        user_id: user.id,
        title: listTitle,
        description: 'Movies imported from Letterboxd',
        category: 'MOVIES'
      }])
      .single();

    if (listError) {
      console.error("Error creating list:", listError);
      return;
    }
    const listId = listData.id;
    console.log(`Created new list with ID: ${listId}`);

    // Loop through each <item> in the RSS feed.
    for (const item of items) {
      // Get the film title (try the <letterboxd:filmTitle> tag first).
      const filmTitleElem = item.getElementsByTagName("letterboxd:filmTitle")[0];
      const filmTitle = filmTitleElem
        ? filmTitleElem.textContent
        : item.getElementsByTagName("title")[0].textContent;

      // Get the TMDB movie ID.
      const tmdbIdElem = item.getElementsByTagName("tmdb:movieId")[0];
      if (!tmdbIdElem) {
        console.warn(`No TMDB ID found for movie: ${filmTitle}`);
        continue;
      }
      const tmdbId = parseInt(tmdbIdElem.textContent, 10);

      // Extract the poster image URL from the description (which contains HTML).
      let posterPath = null;
      const descriptionElem = item.getElementsByTagName("description")[0];
      if (descriptionElem && descriptionElem.textContent) {
        // Create a temporary element to parse the inner HTML.
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = descriptionElem.textContent;
        const imgElem = tempDiv.querySelector("img");
        if (imgElem) {
          posterPath = imgElem.getAttribute("src");
        }
      }

      // Insert this movie into the "list_items" table.
      const { error: itemError } = await supabase
        .from('list_items')
        .insert([{
          list_id: listId,
          tmdb_id: tmdbId,
          title: filmTitle,
          poster_path: posterPath
          // elo_rating will default to 1500 as defined in the table schema.
        }]);
      if (itemError) {
        console.error(`Error inserting "${filmTitle}" (TMDB ID: ${tmdbId}):`, itemError);
      } else {
        console.log(`Imported movie: ${filmTitle} (TMDB ID: ${tmdbId})`);
      }
    }

    console.log("Letterboxd import complete.");

  } catch (error) {
    console.error("Error importing Letterboxd movies:", error);
  }
}

/* ===== Example usage =====
   You might attach this function to a button click or form submit.
   For instance, if you have an input field (id="username-input") and a button (id="import-button"),
   you can use the following code:
*/

document.getElementById("import-button")?.addEventListener("click", () => {
  const usernameInput = document.getElementById("username-input");
  const letterboxdUsername = usernameInput ? usernameInput.value.trim() : "";
  if (letterboxdUsername) {
    importLetterboxdMovies(letterboxdUsername);
  } else {
    console.warn("Please enter a Letterboxd username.");
  }
});

/* ===== End Example usage ===== */
