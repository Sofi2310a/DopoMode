document.addEventListener("DOMContentLoaded", function ()
{
    let searchInput = document.querySelector(".search-input");
  let searchBtn = document.querySelector(".btn-search");
  let article = document.querySelector(".lesson-article");

  if (!searchInput || !searchBtn || !article) {
    return;
  }

  let lastQuery = "";
  let currentMatchIndex = 0;

  function clearHighlights()
  {
    let marks = article.querySelectorAll("mark.search-highlight");
    for (let i = 0; i < marks.length; i++)
    {
        let mark = marks[i];
        let parent = mark.parentNode;
        let textNode = document.createTextNode(mark.textContent);
        parent.replaceChild(textNode, mark);
        parent.normalize();
    }
  }

  function highlightText(node, query) {
    if (node.nodeType === 3) {
      let text = node.nodeValue;
      let lowerText = text.toLowerCase();
      let lowerQuery = query.toLowerCase();

      let index = lowerText.indexOf(lowerQuery);
      if (index !== -1) {
        let fragment = document.createDocumentFragment();
        let startPos = 0;

        while (index !== -1)
        {
            if (index > startPos)
            {
                let beforeText = text.slice(startPos, index);
                fragment.appendChild(document.createTextNode(beforeText));
            }

            let matchedText = text.slice(index, index + query.length);
            let mark = document.createElement("mark");
            mark.className = "search-highlight";
            mark.textContent = matchedText;
            mark.style.backgroundColor = "#ffe600";
            mark.style.color = "#000000";
            mark.style.padding = "1px 3px";
            mark.style.borderRadius = "4px";

            fragment.appendChild(mark);

            startPos = index + query.length;
            index = lowerText.indexOf(lowerQuery, startPos);
        }

        if (startPos < text.length)
        {
            let afterText = text.slice(startPos);
            fragment.appendChild(document.createTextNode(afterText));
        }

        node.parentNode.replaceChild(fragment, node);
      }
    }
    else if (node.nodeType === 1)
    {
        let tag = node.tagName.toLowerCase();
        if (tag === "script" || tag === "style" || tag === "textarea" || tag === "mark")
        {
            return;
        }

        let children = [];
        for (let i = 0; i < node.childNodes.length; i++)
        {
            children.push(node.childNodes[i]);
        }

        for (let i = 0; i < children.length; i++)
        {
            highlightText(children[i], query);
        }
    }
  }

  function scrollToMatch(matches, index)
  {
    for (let i = 0; i < matches.length; i++)
    {
      matches[i].style.backgroundColor = "#ffe600";
      matches[i].style.outline = "none";
    }

    let activeMatch = matches[index];
    activeMatch.style.backgroundColor = "#ff7ae5";
    activeMatch.style.outline = "2px solid #ffffff";

    activeMatch.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function performSearch()
  {
    let query = searchInput.value.trim();

    if (query === "")
    {
      clearHighlights();
      lastQuery = "";
      currentMatchIndex = 0;
      return;
    }

    if (query.toLowerCase() === lastQuery.toLowerCase())
    {
      let existingMatches = article.querySelectorAll("mark.search-highlight");
      if (existingMatches.length > 0) {
        currentMatchIndex++;
        if (currentMatchIndex >= existingMatches.length)
        {
          currentMatchIndex = 0;
        }
        scrollToMatch(existingMatches, currentMatchIndex);
        return;
      }
    }

    clearHighlights();
    lastQuery = query;
    currentMatchIndex = 0;

    highlightText(article, query);

    let matches = article.querySelectorAll("mark.search-highlight");
    if (matches.length > 0)
    {
      scrollToMatch(matches, currentMatchIndex);
    } else {
      alert((document.documentElement.lang === "uk" ? "Нічого не знайдено за запитом: " : "Nothing found for: ") + query);
    }
  }

  searchBtn.addEventListener("click", performSearch);

  searchInput.addEventListener("keydown", function (event)
  {
    if (event.key === "Enter")
    {
      event.preventDefault();
      performSearch();
    }
  });
});