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

const modalityNames = ["活動宮", "不動宮", "柔軟宮"];

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
const sort45Result = document.getElementById("sort45Result");

const sort90List = document.getElementById("sort90List");
const sort45List = document.getElementById("sort45List");

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

const fetchChartButton = document.getElementById("fetchChartButton");
const calculateFromChartButton = document.getElementById("calculateFromChartButton");

const birthDate = document.getElementById("birthDate");
const birthTime = document.getElementById("birthTime");
const birthPlace = document.getElementById("birthPlace");

const chartLoadingMessage = document.getElementById("chartLoadingMessage");
const chartErrorMessage = document.getElementById("chartErrorMessage");

const chartResultList = document.getElementById("chartResultList");
const chartTargetA = document.getElementById("chartTargetA");
const chartTargetB = document.getElementById("chartTargetB");
const chartTargetADisplay = document.getElementById("chartTargetADisplay");
const chartTargetBDisplay = document.getElementById("chartTargetBDisplay");

let fetchedChartData = null;

calculateButton.addEventListener("click", () => {
  const inputA = getPlanetInput("A");
  const inputB = getPlanetInput("B");

  const validationError = validateInputs(inputA, inputB);
  clearError();

  if (validationError) {
    showError(validationError);
    clearResults();
    clearSavedResultData();
    return;
  }

  calculateMidpointFromInputs(inputA, inputB);
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

  const sort90Texts = getCandidateTexts(sort90List);
  const sort45Texts = getCandidateTexts(sort45List);

  const textToCopy = [
    planetAResult.textContent,
    planetBResult.textContent,
    midpointResult.textContent,
    sort45Result.textContent,
    "90度ソート4候補：",
    ...sort90Texts.map(text => `- ${text}`),
    "45度ソート4候補：",
    ...sort45Texts.map(text => `- ${text}`)
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

fetchChartButton.addEventListener("click", () => {
  handleFetchChartMock();
});

chartTargetA.addEventListener("change", updateChartTargetDisplays);
chartTargetB.addEventListener("change", updateChartTargetDisplays);

calculateFromChartButton.addEventListener("click", () => {
  handleCalculateFromChart();
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
    return "同じ対象は選択できません";
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

function longitudeToPosition(longitude) {
  const normalized = ((longitude % 360) + 360) % 360;

  let signIndex = Math.floor(normalized / 30);
  const signDegreeFloat = normalized % 30;

  let degree = Math.floor(signDegreeFloat);
  let minute = Math.round((signDegreeFloat - degree) * 60);

  if (minute === 60) {
    minute = 0;
    degree += 1;
  }

  if (degree === 30) {
    degree = 0;
    signIndex = (signIndex + 1) % 12;
  }

  return {
    signIndex,
    signName: signNames[signIndex],
    modalityName: getModalityName(signIndex),
    degree,
    minute
  };
}

function getModalityName(signIndex) {
  return modalityNames[signIndex % 3];
}

function buildFourCandidates(baseLongitude) {
  const offsets = [0, 90, 180, 270];

  return offsets.map((offset) => {
    const position = longitudeToPosition(baseLongitude + offset);
    return `${position.signName} ${position.degree}度 ${pad2(position.minute)}分`;
  });
}

function renderCandidateList(listElement, candidates) {
  listElement.innerHTML = "";

  candidates.forEach((candidate) => {
    const li = document.createElement("li");
    li.textContent = candidate;
    listElement.appendChild(li);
  });
}

function getCandidateTexts(listElement) {
  return Array.from(listElement.querySelectorAll("li")).map(li => li.textContent);
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

function clearCopyMessage() {
  copyMessage.textContent = "";
}

function clearResults() {
  planetAResult.textContent = "天体A：-";
  planetBResult.textContent = "天体B：-";
  midpointResult.textContent = "ミッドポイント：-";
  sort45Result.textContent = "45度ソート：-";
  sort90List.innerHTML = "<li>-</li>";
  sort45List.innerHTML = "<li>-</li>";
}

function renderResults(resultData) {
  planetAResult.textContent = resultData.planetAText;
  planetBResult.textContent = resultData.planetBText;
  midpointResult.textContent = resultData.midpointText;
  sort45Result.textContent = resultData.sort45Text;
  renderCandidateList(sort90List, resultData.sort90Candidates);
  renderCandidateList(sort45List, resultData.sort45Candidates);
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
      typeof resultData.midpointText === "string" &&
      typeof resultData.sort45Text === "string" &&
      Array.isArray(resultData.sort90Candidates) &&
      Array.isArray(resultData.sort45Candidates)
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

function handleFetchChartMock() {
  clearChartError();
  hideChartLoading();

  if (!birthDate.value) {
    showChartError("生年月日を入力してください");
    return;
  }

  if (!birthTime.value) {
    showChartError("出生時刻を入力してください");
    return;
  }

  if (!birthPlace.value.trim()) {
    showChartError("出生地を入力してください");
    return;
  }

  showChartLoading("星周りを計算しています...");

  setTimeout(() => {
    hideChartLoading();

    fetchedChartData = {
      sun: { label: "太陽", sign: "やぎ座", signIndex: 9, degree: 13, minute: 20, longitude: 283.3333 },
      moon: { label: "月", sign: "しし座", signIndex: 4, degree: 15, minute: 5, longitude: 135.0833 },
      mercury: { label: "水星", sign: "みずがめ座", signIndex: 10, degree: 2, minute: 41, longitude: 302.6833 },
      venus: { label: "金星", sign: "いて座", signIndex: 8, degree: 29, minute: 11, longitude: 269.1833 },
      jupiter: { label: "木星", sign: "うお座", signIndex: 11, degree: 4, minute: 50, longitude: 334.8333 },
      saturn: { label: "土星", sign: "おうし座", signIndex: 1, degree: 10, minute: 3, longitude: 40.05 },
      uranus: { label: "天王星", sign: "みずがめ座", signIndex: 10, degree: 12, minute: 44, longitude: 312.7333 },
      neptune: { label: "海王星", sign: "みずがめ座", signIndex: 10, degree: 1, minute: 8, longitude: 301.1333 },
      pluto: { label: "冥王星", sign: "いて座", signIndex: 8, degree: 9, minute: 55, longitude: 249.9167 },
      asc: { label: "アセンダント", sign: "おひつじ座", signIndex: 0, degree: 18, minute: 12, longitude: 18.2 },
      mc: { label: "MC", sign: "やぎ座", signIndex: 9, degree: 6, minute: 30, longitude: 276.5 },
      node: { label: "ノード", sign: "ふたご座", signIndex: 2, degree: 22, minute: 10, longitude: 82.1667 }
    };

    renderChartResultList(fetchedChartData);
    populateChartTargetSelects(fetchedChartData);
    updateChartTargetDisplays();
  }, 700);
}

function renderChartResultList(chartData) {
  chartResultList.innerHTML = "";

  Object.values(chartData).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.label}：${item.sign} ${item.degree}度 ${pad2(item.minute)}分`;
    chartResultList.appendChild(li);
  });
}

function populateChartTargetSelects(chartData) {
  const defaultOptionText = "選択してください";

  chartTargetA.innerHTML = `<option value="">${defaultOptionText}</option>`;
  chartTargetB.innerHTML = `<option value="">${defaultOptionText}</option>`;

  Object.entries(chartData).forEach(([key, item]) => {
    const optionA = document.createElement("option");
    optionA.value = key;
    optionA.textContent = item.label;
    chartTargetA.appendChild(optionA);

    const optionB = document.createElement("option");
    optionB.value = key;
    optionB.textContent = item.label;
    chartTargetB.appendChild(optionB);
  });
}

function updateChartTargetDisplays() {
  chartTargetADisplay.textContent = `対象A：${formatChartTargetDisplay(chartTargetA.value)}`;
  chartTargetBDisplay.textContent = `対象B：${formatChartTargetDisplay(chartTargetB.value)}`;
}

function formatChartTargetDisplay(key) {
  if (!key || !fetchedChartData || !fetchedChartData[key]) {
    return "-";
  }

  const item = fetchedChartData[key];
  return `${item.label}（${item.sign} ${item.degree}度 ${pad2(item.minute)}分）`;
}

function handleCalculateFromChart() {
  clearError();

  if (!fetchedChartData) {
    showError("先に星周りを取得してください");
    return;
  }

  const keyA = chartTargetA.value;
  const keyB = chartTargetB.value;

  if (!keyA || !keyB) {
    showError("対象Aと対象Bを選択してください");
    return;
  }

  if (keyA === keyB) {
    showError("同じ対象は選択できません");
    return;
  }

  const itemA = fetchedChartData[keyA];
  const itemB = fetchedChartData[keyB];

  const inputA = {
    planet: keyA,
    sign: String(itemA.signIndex),
    degree: String(itemA.degree),
    minute: String(itemA.minute)
  };

  const inputB = {
    planet: keyB,
    sign: String(itemB.signIndex),
    degree: String(itemB.degree),
    minute: String(itemB.minute)
  };

  calculateMidpointFromInputs(inputA, inputB);
}

function calculateMidpointFromInputs(inputA, inputB) {
  clearError();
  clearCopyMessage();

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
  const midpointPosition = longitudeToPosition(midpointLongitude);

  const sort45BaseLongitude = midpointLongitude + 45;
  const sort45BasePosition = longitudeToPosition(sort45BaseLongitude);

  const sort90Candidates = buildFourCandidates(midpointLongitude);
  const sort45Candidates = buildFourCandidates(sort45BaseLongitude);

  const resultData = {
    planetAText: `${planetNames[inputA.planet]}：${formatPosition(inputA.sign, inputA.degree, inputA.minute)}`,
    planetBText: `${planetNames[inputB.planet]}：${formatPosition(inputB.sign, inputB.degree, inputB.minute)}`,
    midpointText: `ミッドポイント：${midpointPosition.signName} ${midpointPosition.degree}度 ${pad2(midpointPosition.minute)}分（${midpointPosition.modalityName}）`,
    sort45Text: `45度ソート：${sort45BasePosition.modalityName}の${sort45BasePosition.degree}度 ${pad2(sort45BasePosition.minute)}分`,
    sort90Candidates,
    sort45Candidates
  };

  renderResults(resultData);
  saveResultData(resultData);
}

function showChartLoading(message) {
  chartLoadingMessage.textContent = message;
  chartLoadingMessage.classList.add("is-visible");
}

function hideChartLoading() {
  chartLoadingMessage.textContent = "";
  chartLoadingMessage.classList.remove("is-visible");
}

function showChartError(message) {
  chartErrorMessage.textContent = message;
  chartErrorMessage.classList.add("is-visible");
}

function clearChartError() {
  chartErrorMessage.textContent = "";
  chartErrorMessage.classList.remove("is-visible");
}