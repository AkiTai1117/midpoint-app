const planetNames = {
  sun: "太陽",
  moon: "月",
  mercury: "水星",
  venus: "金星",
  jupiter: "木星",
  saturn: "土星",
  uranus: "天王星",
  neptune: "海王星",
  pluto: "冥王星",
  asc: "アセンダント",
  mc: "MC",
  node: "ノード"
};

const signNames = [
  "おひつじ座",
  "おうし座",
  "ふたご座",
  "かに座",
  "しし座",
  "おとめ座",
  "てんびん座",
  "さそり座",
  "いて座",
  "やぎ座",
  "みずがめ座",
  "うお座"
];

const FORM_STORAGE_KEY = "midpointAppFormData";
const RESULT_STORAGE_KEY = "midpointAppResultData";

const calculateButton = document.getElementById("calculateButton");
const resetButton = document.getElementById("resetButton");
const copyResultButton = document.getElementById("copyResultButton");
const errorMessage = document.getElementById("errorMessage");
const copyMessage = document.getElementById("copyMessage");

const planetAResult = document.getElementById("planetAResult");
const planetBResult = document.getElementById("planetBResult");
const midpointResult = document.getElementById("midpointResult");

const formElementIds = [
  "planetA",
  "signA",
  "degreeA",
  "minuteA",
  "planetB",
  "signB",
  "degreeB",
  "minuteB"
];

calculateButton.addEventListener("click", () => {
  clearError();
  clearCopyMessage();

  const inputA = getPlanetInput("A");
  const inputB = getPlanetInput("B");

  const validationError = validateInputs(inputA, inputB);
  if (validationError) {
    showError(validationError);
    clearResults();
    clearSavedResultData();
    return;
  }

  const longitudeA = toLongitude(inputA.sign, inputA.degree, inputA.minute);
  const longitudeB = toLongitude(inputB.sign, inputB.degree, inputB.minute);

  const diff = getAngleDifference(longitudeA, longitudeB);

  if (Math.abs(diff - 180) < 0.000001) {
    showError("2点が正反対（180度）のためミッドポイントが一意に定まりません");
    clearResults();
    clearSavedResultData();
    return;
  }

  const midpointLongitude = calculateMidpoint(longitudeA, longitudeB);
  const midpointPosition = longitudeToSignDegreeMinute(midpointLongitude);

  const resultData = {
    planetAText: `${planetNames[inputA.planet]}：${formatPosition(inputA.sign, inputA.degree, inputA.minute)}`,
    planetBText: `${planetNames[inputB.planet]}：${formatPosition(inputB.sign, inputB.degree, inputB.minute)}`,
    midpointText: `ミッドポイント：${midpointPosition.signName} ${midpointPosition.degree}度 ${pad2(midpointPosition.minute)}分`
  };

  renderResults(resultData);
  saveResultData(resultData);
});

resetButton.addEventListener("click", () => {
  resetForm();
});

copyResultButton.addEventListener("click", async () => {
  clearCopyMessage();

  if (midpointResult.textContent === "ミッドポイント：-") {
    copyMessage.textContent = "コピーできる計算結果がありません";
    return;
  }

  const textToCopy = [
    planetAResult.textContent,
    planetBResult.textContent,
    midpointResult.textContent
  ].join("\n");

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyMessage.textContent = "計算結果をコピーしました";
  } catch (error) {
    copyMessage.textContent = "コピーに失敗しました";
    console.error("コピーに失敗しました:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  restoreFormData();
  restoreResultData();
  attachAutoSave();
});

function getPlanetInput(suffix) {
  return {
    planet: document.getElementById(`planet${suffix}`).value,
    sign: document.getElementById(`sign${suffix}`).value,
    degree: document.getElementById(`degree${suffix}`).value,
    minute: document.getElementById(`minute${suffix}`).value
  };
}

function validateInputs(inputA, inputB) {
  const allValues = [
    inputA.planet, inputA.sign, inputA.degree, inputA.minute,
    inputB.planet, inputB.sign, inputB.degree, inputB.minute
  ];

  const hasEmptyValue = allValues.some(value => value === "");
  if (hasEmptyValue) {
    return "すべての項目を入力してください";
  }

  if (inputA.planet === inputB.planet) {
    return "同じ天体は選択できません";
  }

  const degreeA = Number(inputA.degree);
  const minuteA = Number(inputA.minute);
  const degreeB = Number(inputB.degree);
  const minuteB = Number(inputB.minute);

  if (!Number.isInteger(degreeA) || degreeA < 0 || degreeA > 29) {
    return "天体Aの度は0〜29で入力してください";
  }

  if (!Number.isInteger(minuteA) || minuteA < 0 || minuteA > 59) {
    return "天体Aの分は0〜59で入力してください";
  }

  if (!Number.isInteger(degreeB) || degreeB < 0 || degreeB > 29) {
    return "天体Bの度は0〜29で入力してください";
  }

  if (!Number.isInteger(minuteB) || minuteB < 0 || minuteB > 59) {
    return "天体Bの分は0〜59で入力してください";
  }

  return null;
}

function toLongitude(sign, degree, minute) {
  return Number(sign) * 30 + Number(degree) + Number(minute) / 60;
}

function getAngleDifference(longitude1, longitude2) {
  const diff = Math.abs(longitude1 - longitude2);
  return Math.min(diff, 360 - diff);
}

function calculateMidpoint(longitude1, longitude2) {
  let adjusted1 = longitude1;
  let adjusted2 = longitude2;

  if (Math.abs(longitude1 - longitude2) > 180) {
    if (longitude1 < longitude2) {
      adjusted1 += 360;
    } else {
      adjusted2 += 360;
    }
  }

  let midpoint = (adjusted1 + adjusted2) / 2;
  midpoint = midpoint % 360;

  if (midpoint < 0) {
    midpoint += 360;
  }

  return midpoint;
}

function longitudeToSignDegreeMinute(longitude) {
  const normalized = ((longitude % 360) + 360) % 360;

  const signIndex = Math.floor(normalized / 30);
  const signDegreeFloat = normalized % 30;

  let degree = Math.floor(signDegreeFloat);
  let minute = Math.round((signDegreeFloat - degree) * 60);

  if (minute === 60) {
    minute = 0;
    degree += 1;
  }

  if (degree === 30) {
    degree = 0;
    return {
      signName: signNames[(signIndex + 1) % 12],
      degree,
      minute
    };
  }

  return {
    signName: signNames[signIndex],
    degree,
    minute
  };
}

function formatPosition(sign, degree, minute) {
  return `${signNames[Number(sign)]} ${Number(degree)}度 ${pad2(Number(minute))}分`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add("is-visible");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.remove("is-visible");
}

function showCopyMessage(message) {
  copyMessage.textContent = message;
}

function clearCopyMessage() {
  copyMessage.textContent = "";
}

function clearResults() {
  planetAResult.textContent = "天体A：-";
  planetBResult.textContent = "天体B：-";
  midpointResult.textContent = "ミッドポイント：-";
}

function renderResults(resultData) {
  planetAResult.textContent = resultData.planetAText;
  planetBResult.textContent = resultData.planetBText;
  midpointResult.textContent = resultData.midpointText;
}

function attachAutoSave() {
  formElementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("input", saveFormData);
    element.addEventListener("change", saveFormData);
  });
}

function saveFormData() {
  const formData = {};

  formElementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    formData[id] = element.value;
  });

  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
}

function restoreFormData() {
  const savedData = localStorage.getItem(FORM_STORAGE_KEY);
  if (!savedData) return;

  try {
    const formData = JSON.parse(savedData);

    formElementIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      if (typeof formData[id] === "string") {
        element.value = formData[id];
      }
    });
  } catch (error) {
    console.error("保存データの復元に失敗しました:", error);
  }
}

function saveResultData(resultData) {
  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(resultData));
}

function restoreResultData() {
  const savedData = localStorage.getItem(RESULT_STORAGE_KEY);
  if (!savedData) return;

  try {
    const resultData = JSON.parse(savedData);

    if (
      typeof resultData.planetAText === "string" &&
      typeof resultData.planetBText === "string" &&
      typeof resultData.midpointText === "string"
    ) {
      renderResults(resultData);
    }
  } catch (error) {
    console.error("結果データの復元に失敗しました:", error);
  }
}

function clearSavedResultData() {
  localStorage.removeItem(RESULT_STORAGE_KEY);
}

function resetForm() {
  formElementIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.value = "";
  });

  localStorage.removeItem(FORM_STORAGE_KEY);
  clearSavedResultData();
  clearError();
  clearCopyMessage();
  clearResults();
}