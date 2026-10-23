let currentInput = '';
let previousInput = '';
let operation = null;

function appendNumber(number) {
  if (number === '.' && currentInput.includes('.')) {
    return;
  }
  currentInput += number;
  updateDisplay();
}

function setOperation(op) {
  if (currentInput === '') {
    return;
  }
  previousInput = currentInput;
  operation = op;
  currentInput = '';
}

function clearDisplay() {
  currentInput = '';
  previousInput = '';
  operation = null;
  updateDisplay();
}

function calculate() {
  if (previousInput === '' || currentInput === '') {
    printToDisplay('Error');
    return;
  }
  let previous = parseFloat(previousInput);
  let current = parseFloat(currentInput);
  let result;
  switch (operation) {
    case '+':
      result = previous + current;
      break;
    case '-':
      result = previous - current;
      break;
    case '*':
      result = previous * current;
      break;
    case '/':
      if (current === 0) {
        printToDisplay('Cannot divide by zero');
        return;
      }
      result = previous / current;
      break;
    default:
      printToDisplay('Error');
      return;
  }
  currentInput = result.toString();
  previousInput = '';
  operation = null;
  updateDisplay();
}

function updateDisplay() {
  document.getElementById('display').value = currentInput;
}

function printToDisplay(message) {
  document.getElementById('display').value = message;
}
