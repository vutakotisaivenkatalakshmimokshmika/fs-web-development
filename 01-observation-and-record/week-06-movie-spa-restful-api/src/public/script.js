function hideAll() {
  document.querySelectorAll(".page").forEach(page => page.style.display = "none");
}

function showPage(id) {
  hideAll();
  document.getElementById(id).style.display = "block";
  document.getElementById("output").innerHTML = "";
}

function goHome() {
  hideAll();
  document.getElementById("home").style.display = "block";
  document.getElementById("output").innerHTML = "";
}

async function addMovie() {
  const response = await fetch('/add-movie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: document.getElementById("title").value,
      director: document.getElementById("director").value,
      year: Number(document.getElementById("year").value),
      rating: Number(document.getElementById("rating").value)
    })
  });
  document.getElementById("output").innerHTML = await response.text();
}

async function updateMovie() {
  const response = await fetch('/update-movie', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: document.getElementById("updateTitle").value,
      newRating: Number(document.getElementById("newRating").value)
    })
  });
  document.getElementById("output").innerHTML = await response.text();
}

async function deleteMovie() {
  const title = document.getElementById("deleteTitle").value;
  const response = await fetch('/movies/' + encodeURIComponent(title), {
    method: 'DELETE'
  });
  const data = await response.json();
  document.getElementById("output").innerHTML = data.message;
}

async function viewMovies() {
  hideAll();
  document.getElementById("viewPage").style.display = "block";

  const response = await fetch('/movies');
  const movies = await response.json();

  let table = `
    <table>
      <tr>
        <th>Title</th>
        <th>Director</th>
        <th>Year</th>
        <th>Rating</th>
      </tr>
  `;
  movies.forEach(movie => {
    table += `
      <tr>
        <td>${movie.title}</td>
        <td>${movie.director}</td>
        <td>${movie.year}</td>
        <td>${movie.rating}</td>
      </tr>
    `;
  });
  table += "</table>";
  document.getElementById("movieTable").innerHTML = table;
}
