
let matrix = [];
let rows, cols;

function createMatrix() {
  rows = parseInt(document.getElementById("rows").value);
  cols = parseInt(document.getElementById("cols").value);
  if (rows < 1 || cols < 2) {
    alert("Please enter valid values.");
    return;
  }
  matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  const table = document.getElementById("matrixTable");
  table.innerHTML = "";

  const headerRow = table.insertRow();
  const emptyCell = document.createElement("th");
  emptyCell.textContent = "";
  headerRow.appendChild(emptyCell);

  for (let j = 0; j < cols; j++) {
    const th = document.createElement("th");
    th.textContent = j + 1;
    headerRow.appendChild(th);
  }

  for (let i = 0; i < rows; i++) {
    const row = table.insertRow();
    const rowNumCell = document.createElement("th");
    rowNumCell.textContent = i + 1;
    row.appendChild(rowNumCell);

    for (let j = 0; j < cols; j++) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.value = 0;
      input.onchange = () => (matrix[i][j] = parseFloat(input.value) || 0);
      cell.appendChild(input);
    }
  }

  document.getElementById("matrixDiv").classList.remove("hidden");
  document.getElementById("output").innerHTML = "";
}

function showModify() {
  document.getElementById("modifyDiv").classList.remove("hidden");
}

function hideModify() {
  document.getElementById("modifyDiv").classList.add("hidden");
}

function modifyElement() {
  const r = parseInt(document.getElementById("modRow").value) - 1;
  const c = parseInt(document.getElementById("modCol").value) - 1;
  const val = parseFloat(document.getElementById("modValue").value);

  if (r >= 0 && r < rows && c >= 0 && c < cols) {
    matrix[r][c] = val;
    document.getElementById("matrixTable")
      .rows[r + 1].cells[c + 1].querySelector("input").value = val;
    alert("Modified successfully.");
  } else {
    alert("Invalid row or column number.");
  }
}

function solveSystem() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      matrix[i][j] =
        parseFloat(
          document.getElementById("matrixTable")
            .rows[i + 1].cells[j + 1].querySelector("input").value
        ) || 0;
    }
  }

  const method = document.getElementById("method").value;
  let output = "Original Matrix:\n" + printMatrix(matrix) + "\n\n";
  output += "System of Equations:\n" + printEquations(matrix) + "\n\n";

  if (method === "gaussian") {
    const { matrix: echelon, steps } = rowEchelon(cloneMatrix(matrix));

    if (steps.length > 0) {
      output += "Gaussian Elimination Steps:\n";
      steps.forEach((step, index) => {
        output += `Step ${index + 1}: ${step.description}\n${printMatrix(step.matrix)}\n\n`;
      });
    }

    output += "Row Echelon Form:\n" + printMatrix(echelon) + "\n\n";

    const result = analyzeSystem(echelon);
    if (result === "unique") {
      const solution = backSubstitution(echelon);
      output += "Solution:\n";
      for (let i = 0; i < solution.length; i++) {
        output += `x${i + 1} = ${solution[i].toFixed(3)}\n`;
      }
      output += "\nThe system has 1 solution.\n";
    } else if (result === "infinite") {
      output += "The system has infinitely many solutions.\n";
    } else {
      output += "The system has no solution.\n";
    }

  } else if (method === "gaussJordan") {
    const { matrix: rref, steps } = gaussJordan(cloneMatrix(matrix));

    if (steps.length > 0) {
      output += "Gauss-Jordan Elimination Steps:\n";
      steps.forEach((step, index) => {
        output += `Step ${index + 1}: ${step.description}\n${printMatrix(step.matrix)}\n\n`;
      });
    }

    output += "Reduced Row Echelon Form:\n" + printMatrix(rref) + "\n\n";

    const result = analyzeSystem(rref);

    if (result === "unique") {
      const solution = extractSolution(rref);
      output += "Solution:\n";
      for (let i = 0; i < solution.length; i++) {
        output += `x${i + 1} = ${solution[i].toFixed(3)}\n`;
      }
      output += "\nThe system has 1 solution.\n";
    } else if (result === "infinite") {
      output += "The system has infinitely many solutions.\n";
    } else {
      output += "The system has no solution.\n";
    }
  }

  document.getElementById("output").innerHTML = output;
}

function printMatrix(mat) {
  return mat.map(row => row.map(val => val.toFixed(3)).join(" ")).join("\n");
}

function printEquations(mat) {
  const vars = cols - 1;
  return mat.map((row) => {
    let eq = "";
    for (let j = 0; j < vars; j++) {
      const coeff = row[j];
      if (Math.abs(coeff) > 1e-10) {
        const sign = coeff > 0 && j !== 0 ? " + " : coeff < 0 ? " - " : "";
        eq += `${sign}${Math.abs(coeff)}x${j + 1}`;
      }
    }
    eq += ` = ${row[cols - 1]}`;
    return eq;
  }).join("\n");
}

function cloneMatrix(mat) {
  return mat.map(row => [...row]);
}

function rowEchelon(mat) {
  const result = cloneMatrix(mat);
  const steps = [];
  let lead = 0;

  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;
    let i = r;

    while (Math.abs(result[i][lead]) < 1e-10) {
      i++;
      if (i === rows) {
        i = r;
        lead++;
        if (lead === cols) return { matrix: result, steps };
      }
    }

    if (i !== r) {
      swapRows(result, i, r);
      steps.push({ description: `Swap row ${r + 1} with row ${i + 1}.`, matrix: cloneMatrix(result) });
    }

    const lv = result[r][lead];
    for (let j = 0; j < cols; j++) result[r][j] /= lv;

    steps.push({ description: `Make pivot 1 in row ${r + 1}.`, matrix: cloneMatrix(result) });

    for (let i2 = r + 1; i2 < rows; i2++) {
      const lv2 = result[i2][lead];
      for (let j = 0; j < cols; j++) result[i2][j] -= lv2 * result[r][j];
    }

    steps.push({ description: `Eliminate below pivot.`, matrix: cloneMatrix(result) });
    lead++;
  }

  return { matrix: result, steps };
}

function gaussJordan(mat) {
  const result = cloneMatrix(mat);
  const steps = [];
  let lead = 0;

  for (let r = 0; r < rows; r++) {
    if (lead >= cols) break;
    let i = r;

    while (Math.abs(result[i][lead]) < 1e-10) {
      i++;
      if (i === rows) {
        i = r;
        lead++;
        if (lead === cols) return { matrix: result, steps };
      }
    }

    if (i !== r) {
      swapRows(result, i, r);
      steps.push({ description: `Swap row ${r + 1} with row ${i + 1}.`, matrix: cloneMatrix(result) });
    }

    const lv = result[r][lead];
    for (let j = 0; j < cols; j++) result[r][j] /= lv;

    steps.push({ description: `Make pivot 1 in row ${r + 1}.`, matrix: cloneMatrix(result) });

    for (let i2 = 0; i2 < rows; i2++) {
      if (i2 !== r) {
        const lv2 = result[i2][lead];
        for (let j = 0; j < cols; j++) result[i2][j] -= lv2 * result[r][j];
      }
    }

    steps.push({ description: `Eliminate above & below pivot.`, matrix: cloneMatrix(result) });
    lead++;
  }

  return { matrix: result, steps };
}

function analyzeSystem(mat) {
  const vars = cols - 1;
  let rank = 0, rankAug = 0;

  for (let i = 0; i < rows; i++) {
    let zero = true;
    for (let j = 0; j < vars; j++) if (Math.abs(mat[i][j]) > 1e-10) zero = false;
    if (!zero) rank++;
  }

  for (let i = 0; i < rows; i++) {
    let zero = true;
    for (let j = 0; j < cols; j++) if (Math.abs(mat[i][j]) > 1e-10) zero = false;
    if (!zero) rankAug++;
  }

  if (rank !== rankAug) return "none";
  if (rank < vars) return "infinite";
  return "unique";
}

function backSubstitution(mat) {
  const vars = cols - 1;
  const solution = Array(vars).fill(0);

  for (let i = rows - 1; i >= 0; i--) {
    let sum = mat[i][cols - 1];
    for (let j = i + 1; j < vars; j++) sum -= mat[i][j] * solution[j];
    solution[i] = sum / mat[i][i];
  }

  return solution;
}

function extractSolution(mat) {
  const vars = cols - 1;
  const sol = [];
  for (let i = 0; i < vars; i++) sol.push(mat[i][cols - 1]);
  return sol;
}

function swapRows(mat, r1, r2) {
  [mat[r1], mat[r2]] = [mat[r2], mat[r1]];
}
