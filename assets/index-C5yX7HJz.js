(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const LOTTO_COST = 1e3;
const LOTTO_COUNT = 6;
const LOTTO_RANK = {
  "5th": {
    matchCount: 3,
    money: 5e3,
    requireBonus: false
  },
  "4th": {
    matchCount: 4,
    money: 5e4,
    requireBonus: false
  },
  "3rd": {
    matchCount: 5,
    money: 15e5,
    requireBonus: false
  },
  "2nd": {
    matchCount: 5,
    money: 3e7,
    requireBonus: true
  },
  "1st": {
    matchCount: 6,
    money: 2e9,
    requireBonus: false
  }
};
const ERROR_MESSAGE = {
  COMMON: {
    INVALID_NUMBER: "[ERROR] 숫자 형식이 올바르지 않습니다."
  },
  LOTTO: {
    INVALID_NUMBER: "[ERROR] 로또 번호는 1부터 45 사이의 숫자여야 합니다.",
    INVALID_LENGTH: "[ERROR] 로또 번호는 6개여야 합니다.",
    DUPLICATE: "[ERROR] 로또 번호는 중복될 수 없습니다."
  },
  PURCHASE: {
    INVALID_UNIT: "[ERROR] 구입 금액은 1,000원 단위여야 합니다.",
    TOO_LARGE: "[ERROR] 구입 금액이 너무 큽니다."
  },
  BONUS: {
    DUPLICATE: "[ERROR] 보너스 번호는 당첨 번호와 중복될 수 없습니다."
  }
};
function commonValidate(input) {
  if (isInputEmpty(input)) return false;
  if (!isPositiveInteger(input)) return false;
  if (!isNumberInRange(input)) return false;
  return true;
}
function isInputEmpty(input) {
  return input === "";
}
function isPositiveInteger(input) {
  return /^[1-9]\d*$/.test(input);
}
function isNumberInRange(input) {
  return Number(input) >= 1 && Number(input) <= 45;
}
function isValidUnit(input) {
  return Number(input) % LOTTO_COST === 0;
}
function isTooLarge(input) {
  return BigInt(input) > BigInt(Number.MAX_SAFE_INTEGER);
}
class Purchase {
  #money;
  constructor(moneyInput) {
    this.#validate(moneyInput);
    this.#money = Number(moneyInput);
  }
  #validate(input) {
    if (isInputEmpty(input)) {
      throw new Error(ERROR_MESSAGE.COMMON.INVALID_NUMBER);
    }
    if (!isPositiveInteger(input)) {
      throw new Error(ERROR_MESSAGE.COMMON.INVALID_NUMBER);
    }
    if (isTooLarge(input)) {
      throw new Error(ERROR_MESSAGE.PURCHASE.TOO_LARGE);
    }
    if (!isValidUnit(input)) {
      throw new Error(ERROR_MESSAGE.PURCHASE.INVALID_UNIT);
    }
  }
  getLottoTicketCount() {
    return this.#money / LOTTO_COST;
  }
}
function isArrayInLength(array, length) {
  return array.length === length;
}
function isArrayUnique(array) {
  const uniqueSet = new Set(array);
  return uniqueSet.size === array.length;
}
function isNumberInArray(number, array) {
  return array.includes(number);
}
class Lotto {
  #numbers;
  constructor(numbersInput) {
    this.#validate(numbersInput);
    this.#numbers = [...numbersInput].sort((a, b) => a - b);
  }
  #validate(numbers) {
    if (!numbers.every((number) => commonValidate(number))) {
      throw new Error(ERROR_MESSAGE.LOTTO.INVALID_NUMBER);
    }
    if (!isArrayInLength(numbers, LOTTO_COUNT)) {
      throw new Error(ERROR_MESSAGE.LOTTO.INVALID_LENGTH);
    }
    if (!isArrayUnique(numbers)) {
      throw new Error(ERROR_MESSAGE.LOTTO.DUPLICATE);
    }
  }
  getNumbers() {
    return [...this.#numbers];
  }
}
class WinningLottoManager extends Lotto {
  #bonusNumber;
  constructor(winningLottosInput) {
    super(winningLottosInput);
  }
  setBonusNumber(bonusNumberInput) {
    this.#validateBonusNumber(bonusNumberInput);
    this.#bonusNumber = Number(bonusNumberInput);
  }
  #validateBonusNumber(bonusNumber) {
    if (!commonValidate(bonusNumber)) {
      throw new Error(ERROR_MESSAGE.COMMON.INVALID_NUMBER);
    }
    if (isNumberInArray(Number(bonusNumber), this.getNumbers())) {
      throw new Error(ERROR_MESSAGE.BONUS.DUPLICATE);
    }
  }
  compareWithWinningLotto(lottoNumbers) {
    const winningLottos = this.getNumbers();
    const matchCount = winningLottos.filter((number) => lottoNumbers.includes(number)).length;
    const hasBonus = lottoNumbers.includes(this.#bonusNumber);
    return {
      matchCount,
      hasBonus
    };
  }
}
function pickUniqueNumbersInRange(startInclusive, endInclusive, count) {
  if (![startInclusive, endInclusive, count].every(Number.isInteger)) {
    throw new Error("시작값, 끝값, 개수는 모두 정수여야 합니다.");
  }
  const rangeSize = endInclusive - startInclusive + 1;
  const numbers = Array.from({ length: rangeSize }, (_, index) => startInclusive + index);
  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [numbers[index], numbers[randomIndex]] = [numbers[randomIndex], numbers[index]];
  }
  return numbers.slice(0, count);
}
class LottoMachine {
  #generatedLottos;
  constructor(lottoCount) {
    this.#generatedLottos = this.#generateLottos(lottoCount);
  }
  getLottoTickets() {
    const lottos = this.#generatedLottos.map((lotto) => {
      return lotto.getNumbers();
    });
    return lottos;
  }
  #generateLottos(lottoCount) {
    const lottos = [];
    for (let _ = 0; _ < lottoCount; _++) {
      const numbers = pickUniqueNumbersInRange(1, 45, 6);
      lottos.push(new Lotto(numbers));
    }
    return lottos;
  }
}
function resultCalculator(results) {
  const resultData = Object.values(LOTTO_RANK).map((rank) => ({ ...rank, count: 0 })).sort((a, b) => a.matchCount - b.matchCount || Number(a.requireBonus) - Number(b.requireBonus));
  results.forEach(({ matchCount, hasBonus }) => {
    const rank = resultData.find((r) => r.matchCount === matchCount && r.requireBonus === hasBonus);
    if (rank) rank.count++;
  });
  return resultData;
}
function calculateProfitRate(resultData, purchaseAmount) {
  const totalPrize = resultData.reduce((sum, rank) => {
    return sum + rank.money * rank.count;
  }, 0);
  const rate = totalPrize / purchaseAmount * 100;
  return Math.round(rate * 10) / 10;
}
class LottoResult {
  #lottoResult;
  constructor(winningLottoManager, lottoBundle) {
    this.#calculateResult(winningLottoManager, lottoBundle);
  }
  #calculateResult(winningLottoManager, lottoBundle) {
    this.#lottoResult = lottoBundle.map((lotto) => {
      return winningLottoManager.compareWithWinningLotto(lotto);
    });
  }
  getResult(lottoCount) {
    const resultData = resultCalculator(this.#lottoResult);
    const profitRate = calculateProfitRate(resultData, lottoCount * LOTTO_COST);
    return { resultData, profitRate };
  }
}
const MATCH_ROW_CONFIGS = [
  { rankKey: "5th", selector: "#match-3-count" },
  { rankKey: "4th", selector: "#match-4-count" },
  { rankKey: "3rd", selector: "#match-5-count" },
  { rankKey: "2nd", selector: "#match-5-bonus-count" },
  { rankKey: "1st", selector: "#match-6-count" }
];
const SELECTORS = {
  PURCHASE: {
    FORM: "#purchase-money-form",
    INPUT: "#purchase-money-input"
  },
  RESULT: {
    SECTION: "#result-section",
    TEXT: "#result-text",
    CONTAINER: "#result-container"
  },
  WINNING: {
    SECTION: "#winning-section",
    FORM: "#winning-form",
    INPUTS: ".winning-number-input"
  },
  MODAL: {
    CONTAINER: "#result-modal-container",
    CLOSE_BUTTON: "#modal-close",
    RESTART_BUTTON: "#restart",
    PROFIT_RATE: "#result-profit-rate",
    MATCH_ROWS: MATCH_ROW_CONFIGS
  }
};
function $(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}
function $All(selector) {
  return document.querySelectorAll(selector);
}
function getLottoViewElements() {
  return {
    $purchaseForm: $(SELECTORS.PURCHASE.FORM),
    $purchaseInput: $(SELECTORS.PURCHASE.INPUT),
    $resultSection: $(SELECTORS.RESULT.SECTION),
    $resultText: $(SELECTORS.RESULT.TEXT),
    $resultContainer: $(SELECTORS.RESULT.CONTAINER),
    $winningSection: $(SELECTORS.WINNING.SECTION),
    $winningForm: $(SELECTORS.WINNING.FORM),
    $winningInputs: $All(SELECTORS.WINNING.INPUTS),
    $modalContainer: $(SELECTORS.MODAL.CONTAINER),
    $modalCloseBtn: $(SELECTORS.MODAL.CLOSE_BUTTON),
    $restartBtn: $(SELECTORS.MODAL.RESTART_BUTTON),
    $resultProfitRate: $(SELECTORS.MODAL.PROFIT_RATE),
    $matchCountElements: SELECTORS.MODAL.MATCH_ROWS.map(({ rankKey, selector }) => ({
      element: $(selector),
      matchCount: LOTTO_RANK[rankKey].matchCount,
      requireBonus: LOTTO_RANK[rankKey].requireBonus
    }))
  };
}
function createTicketsHTML(tickets) {
  return tickets.map(
    (ticket) => `
      <div class="lotto-result-line">
        <div class="lotto-ticket-img">🎟️</div>
        <div class="generated-lotto-num">${ticket.join(", ")}</div>
      </div>
    `
  ).join("");
}
function findRankCount(resultData, matchCount, requireBonus = false) {
  const rank = resultData.find((data) => data.matchCount === matchCount && data.requireBonus === requireBonus);
  return rank?.count ?? 0;
}
function getWinningFocusTarget(winningInputs) {
  const inputs = Array.from(winningInputs);
  const firstEmptyInput = inputs.find((input) => input.value === "");
  return firstEmptyInput ?? inputs[inputs.length - 1] ?? inputs[0];
}
function getWinningFormValues(winningInputs) {
  const numbers = Array.from(winningInputs, (input) => input.value);
  const winningNumbers = numbers.slice(0, numbers.length - 1);
  const bonusNumber = numbers[numbers.length - 1];
  return { winningNumbers, bonusNumber };
}
function normalizeWinningInputValue(value) {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 2);
  if (digitsOnly === "") {
    return "";
  }
  const parsedValue = Number(digitsOnly);
  if (parsedValue === 0) {
    return "";
  }
  return parsedValue > 45 ? "45" : String(parsedValue);
}
class LottoView {
  constructor() {
    this.#cacheElements();
    this.bindWinningInputConstraints();
  }
  /* 이벤트 바인딩 */
  bindPurchase(handler) {
    this.$purchaseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handler(this.#getPurchaseInputValue());
    });
  }
  bindResult(handler) {
    this.$winningForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const { winningNumbers, bonusNumber } = this.#getWinningFormValues();
      handler(winningNumbers, bonusNumber);
    });
  }
  bindModalClose() {
    this.$modalCloseBtn.addEventListener("click", () => this.closeModal());
  }
  bindRestart(handler) {
    this.$restartBtn.addEventListener("click", () => handler());
  }
  /* 입력 포커스와 제약 */
  focusPurchaseInput() {
    this.$purchaseInput.focus();
  }
  focusWinningInput() {
    getWinningFocusTarget(this.$winningInputs)?.focus();
  }
  bindWinningInputConstraints() {
    this.$winningInputs.forEach((input) => {
      input.addEventListener("input", ({ target }) => {
        target.value = normalizeWinningInputValue(target.value);
      });
    });
  }
  /* 화면 렌더링 */
  renderLottoTickets(tickets, count) {
    this.#renderPurchaseCount(count);
    this.#renderTicketList(tickets);
    this.#showResultSections();
  }
  renderResultModal(resultData, profitRate) {
    this.#renderMatchCounts(resultData);
    this.$resultProfitRate.textContent = `당신의 총 수익률은 ${profitRate}%입니다.`;
    this.$modalContainer.hidden = false;
  }
  closeModal() {
    this.$modalContainer.hidden = true;
  }
  /* 화면 초기화 */
  resetUI() {
    this.#resetPurchaseInput();
    this.#clearRenderedResult();
    this.#clearWinningInputs();
    this.closeModal();
    this.#hideResultSections();
  }
  /* 내부 helper */
  #cacheElements() {
    Object.assign(this, getLottoViewElements());
  }
  #getPurchaseInputValue() {
    return this.$purchaseInput.value;
  }
  #getWinningFormValues() {
    return getWinningFormValues(this.$winningInputs);
  }
  #renderPurchaseCount(count) {
    this.$resultText.textContent = `총 ${count}개를 구매하였습니다.`;
  }
  #renderTicketList(tickets) {
    this.$resultContainer.innerHTML = createTicketsHTML(tickets);
  }
  #showResultSections() {
    this.$resultSection.hidden = false;
    this.$winningSection.hidden = false;
  }
  #hideResultSections() {
    this.$resultSection.hidden = true;
    this.$winningSection.hidden = true;
  }
  #renderMatchCounts(resultData) {
    this.$matchCountElements.forEach(({ element, matchCount, requireBonus }) => {
      element.textContent = `${findRankCount(resultData, matchCount, requireBonus)}개`;
    });
  }
  #resetPurchaseInput() {
    this.$purchaseInput.value = "";
  }
  #clearRenderedResult() {
    this.$resultContainer.innerHTML = "";
    this.$resultText.textContent = "";
  }
  #clearWinningInputs() {
    this.$winningInputs.forEach((input) => input.value = "");
  }
}
class MainController {
  #view;
  #ticketCount = 0;
  #lottoMachine = null;
  constructor() {
    this.#view = new LottoView();
    this.#bindEvents();
  }
  #bindEvents() {
    this.#view.bindPurchase(this.#handlePurchase.bind(this));
    this.#view.bindResult(this.#handleResult.bind(this));
    this.#view.bindModalClose();
    this.#view.bindRestart(this.#handleRestart.bind(this));
  }
  /* handle 메소드 */
  #handlePurchase(moneyInput) {
    try {
      const { lottoMachine, ticketCount, tickets } = this.#purchaseLottos(moneyInput);
      this.#ticketCount = ticketCount;
      this.#lottoMachine = lottoMachine;
      this.#view.renderLottoTickets(tickets, ticketCount);
    } catch (error) {
      alert(error.message);
      this.#view.focusPurchaseInput();
    }
  }
  #handleResult(winningNumbersInput, bonusNumberInput) {
    try {
      const { resultData, profitRate } = this.#calculateResult(winningNumbersInput, bonusNumberInput);
      this.#view.renderResultModal(resultData, profitRate);
    } catch (error) {
      alert(error.message);
      this.#view.focusWinningInput();
    }
  }
  #handleRestart() {
    this.#resetState();
    this.#view.resetUI();
  }
  /* handle에서 쓰이는 로직 메소드 */
  #purchaseLottos(moneyInput) {
    const purchase = new Purchase(moneyInput);
    const ticketCount = purchase.getLottoTicketCount();
    const lottoMachine = new LottoMachine(ticketCount);
    const tickets = lottoMachine.getLottoTickets();
    return { lottoMachine, ticketCount, tickets };
  }
  #calculateResult(winningNumbersInput, bonusNumberInput) {
    const winningLottoManager = this.#createWinningLottoManager(winningNumbersInput, bonusNumberInput);
    const lottoTickets = this.#lottoMachine.getLottoTickets();
    const lottoResult = new LottoResult(winningLottoManager, lottoTickets);
    return lottoResult.getResult(this.#ticketCount);
  }
  #createWinningLottoManager(winningNumbersInput, bonusNumberInput) {
    const parsedWinningNumbers = winningNumbersInput.map(Number);
    const winningLottoManager = new WinningLottoManager(parsedWinningNumbers);
    winningLottoManager.setBonusNumber(bonusNumberInput);
    return winningLottoManager;
  }
  #resetState() {
    this.#ticketCount = 0;
    this.#lottoMachine = null;
  }
}
function App() {
  new MainController();
}
App();
