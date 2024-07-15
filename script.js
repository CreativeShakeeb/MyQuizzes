// Define constants and global variables
const API = "https://opentdb.com/api.php?amount=10&type=multiple";
const RATE_LIMIT_DELAY = 500; 

// DOM elements
const categoryScreen = document.getElementById('category-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const difficultyButtons = document.getElementById('difficulty-buttons');
const categoriesTab = document.getElementById('categories-tab');
const quizTitle = document.getElementById('quiz-title');
const answerButtonsElement = document.getElementById('answer-buttons');
const nextButton = document.getElementById('next-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');
const percentageElement = document.getElementById('Percentage');
const loader = document.getElementById('loader');
const Restart = document.getElementById('restart');

// Quiz state variables
let currentCategory = null;
let currentDifficulty = "easy";
let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let timerInterval = null;
let timeLeft = 30; // Initial time limit for each question in seconds

// Show and hide loader
function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

// Fetch trivia categories from API
async function fetchCategory() {
    showLoader();
    try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        hideLoader();
        return data.trivia_categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        hideLoader();
        return [];
    }
}

// Display categories and handle category selection
async function displayCategories() {
    const categories = await fetchCategory();
    clearCategoriesTab();
    
    if (categories.length === 0) {
        alert("No categories found. Please try again later.");
        return;
    }

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add("category", "cursor-pointer", "flex", "w-80", "rounded-md", 'bg-dark-blue', "justify-center", "items-center", "m-auto", "mt-8");
        categoryDiv.style.color = "white";
        categoryDiv.textContent = category.name;

        categoryDiv.addEventListener('click', () => {
            currentCategory = category.id;
            displayQuestions();
        });

        categoriesTab.appendChild(categoryDiv);
    });
}

// Clear categories list
function clearCategoriesTab() {
    categoriesTab.innerHTML = '';
}

// Handle difficulty selection
function selectDifficulty() {
    difficultyButtons.addEventListener('click', (event) => {
        const selectedButton = event.target;
        if (selectedButton.tagName.toLowerCase() === 'button') {
            showLoader();
            categoriesTab.classList.add('hidden');
            currentDifficulty = selectedButton.textContent.toLowerCase();
            Array.from(difficultyButtons.children).forEach(button => {
                button.classList.remove('bg-green-500');
            });
            selectedButton.classList.add('bg-green-500');
            setTimeout(() => {
                if (currentDifficulty) {
                    categoriesTab.classList.remove('hidden');
                }
            }, 500);
            displayCategories();
        }
    });
}

// Display quiz questions for selected category and difficulty
async function displayQuestions() {
    questions = await fetchQuestions();
    if (!questions || questions.length === 0) {
        console.error('No questions found for selected category and difficulty.');
        alert('No questions found. Please select another category or difficulty.');
        return;
    }
    categoryScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");
    currentQuestionIndex = 0;  // Reset question index
    score = 0;  // Reset score
    showQuestion(questions[currentQuestionIndex]);
}

// Fetch questions from API
async function fetchQuestions() {
    const questionAPI = `https://opentdb.com/api.php?amount=10&category=${currentCategory}&difficulty=${currentDifficulty}&type=multiple`;
    showLoader();
    categoriesTab.classList.add('hidden')
    try {
        const response = await fetch(questionAPI);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        hideLoader();
        if (!data.results || data.results.length === 0) {
            console.error('No questions found in API response.');
            return [];
        }
        return data.results;
    } catch (error) {
        console.error("Error fetching questions:", error);
        hideLoader();
        alert("Failed to fetch questions. Please check your internet connection and try again.");
        return [];
    }
}

// Show a question with answers
function showQuestion(question) {
    resetTimer();
    quizTitle.textContent = decodeHtmlEntities(question.question);
    answerButtonsElement.innerHTML = '';

    const answers = [...question.incorrect_answers, question.correct_answer];
    answers.sort(() => Math.random() - 0.5);

    answers.forEach(answer => {
        const newdiv = document.createElement("div");
        newdiv.classList.add("question", "flex", "w-80", "rounded-md", "bg-dark-blue", "justify-center", "items-center" ,"m-auto" ,"mt-4" )
        const button = document.createElement("button");
        button.classList.add("w-80", "text-white");
        
        button.textContent = decodeHtmlEntities(answer);
        button.addEventListener('click', () => selectAnswer(button, newdiv, question.correct_answer))
        newdiv.appendChild(button)
        answerButtonsElement.appendChild(newdiv);
    });

    // Clear any existing click event on nextButton before adding new one
    nextButton.removeEventListener('click', moveNextQuestion);
    nextButton.addEventListener('click', moveNextQuestion);
}

// Move to the next question
function moveNextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        showQuestion(questions[currentQuestionIndex]);
        resetTimer(); 
    } else {
        console.log("No more questions");
        clearInterval(timerInterval);
        showResult();
    }
}

// Handle answer selection
function selectAnswer(button, newdiv, correctAnswer) {
    const selectedAnswer = button.textContent;
    if (selectedAnswer === correctAnswer) {
        newdiv.classList.add("bg-green-500");
        score++;
    } else {
        newdiv.classList.add("bg-red-500");
    }
    answerButtonsElement.querySelectorAll('button').forEach(btn => {
        btn.disabled = true;
    });

    // Move to the next question after a brief delay
    setTimeout(() => {
        moveNextQuestion();
    }, 1000); // Adjust delay as needed

    // Highlight the correct answer
    answerButtonsElement.querySelectorAll('button').forEach(btn => {
        if (btn.textContent === correctAnswer) {
            btn.parentNode.classList.add("bg-green-500");
        }
        btn.disabled = true;
    });
}

// Show quiz result
function showResult() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    resultElement.textContent = `${score}`;
    percentageElement.textContent = `${((score / questions.length) * 100).toFixed(2)}%`;
}

Restart.addEventListener('click', (event) => {
    window.location.reload();
})

// Function to decode HTML entities
function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

// Timer functions
function startTimer() {
    timerElement.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            moveNextQuestion();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 30; // Reset timer to initial time limit
    startTimer();
}

// Initialize the quiz application
function initializeQuizApp() {
    selectDifficulty();
    displayCategories();
}

// Start the quiz application
initializeQuizApp();
