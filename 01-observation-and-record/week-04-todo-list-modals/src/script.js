const taskForm = document.getElementById("task-form");
const tasklist = document.getElementById("task-list");
const taskInput = document.getElementById("task-input");
const editModal = document.getElementById("edit-modal");
const editInput = document.getElementById("edit-input");
const saveEdit = document.getElementById("save-edit");
const CloseEditModal = document.getElementById("close-edit-modal");
const deleteModal = document.getElementById("delete-modal");
const confirmDelete = document.getElementById("confirm-delete");
const cancelDelete = document.getElementById("cancel-delete");

let currentTask = null;

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    return;
  }
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = taskText;
  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  li.appendChild(span);
  li.appendChild(editButton);
  li.appendChild(deleteButton);
  tasklist.appendChild(li);
  taskInput.value = "";
});

tasklist.addEventListener("click", function (event) {
  if (event.target.textContent === "Edit") {
    currentTask = event.target.parentElement;
    editInput.value = currentTask.querySelector("span").textContent;
    editModal.style.display = "block";
  }
  if (event.target.textContent === "Delete") {
    currentTask = event.target.parentElement;
    deleteModal.style.display = "block";
  }
});

saveEdit.addEventListener("click", function () {
  const newTask = editInput.value.trim();
  if (newTask !== "" && currentTask) {
    currentTask.querySelector("span").textContent = newTask;
    editModal.style.display = "none";
    currentTask = null;
  }
});

CloseEditModal.addEventListener("click", function () {
  editModal.style.display = "none";
  currentTask = null;
});

confirmDelete.addEventListener("click", function () {
  if (currentTask) {
    currentTask.remove();
  }
  deleteModal.style.display = "none";
  currentTask = null;
});

cancelDelete.addEventListener("click", function () {
  deleteModal.style.display = "none";
  currentTask = null;
});

window.addEventListener("click", function (event) {
  if (event.target === editModal) {
    editModal.style.display = "none";
    currentTask = null;
  }
  if (event.target === deleteModal) {
    deleteModal.style.display = "none";
    currentTask = null;
  }
});
