const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define file paths
const inputFile = path.join(__dirname, '../docs/题库001.html');
const outputFile = path.join(__dirname, '../dist/questions.json');

const html = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(html);

const questions = [];

// Parse Single Choice
$('#testpaper-questions-single_choice .testpaper-question').each((i, el) => {
    const q = $(el);
    const id = q.attr('id');
    const stem = q.find('.testpaper-question-stem').text().trim();
    const options = [];
    q.find('.testpaper-question-choice-item').each((j, optEl) => {
        const optText = $(optEl).text().trim();
        options.push(optText);
    });
    const answerText = q.find('.testpaper-question-result strong.color-success').text().trim();
    const analysis = q.find('.testpaper-question-analysis .well').text().trim();

    questions.push({
        id: id,
        type: 'single',
        stem: stem,
        options: options,
        answer: answerText,
        analysis: analysis
    });
});

// Parse Multiple Choice
$('#testpaper-questions-choice .testpaper-question').each((i, el) => {
    const q = $(el);
    const id = q.attr('id');
    const stem = q.find('.testpaper-question-stem').text().trim();
    const options = [];
    q.find('.testpaper-question-choice-item').each((j, optEl) => {
        const optText = $(optEl).text().trim();
        options.push(optText);
    });
    const answerText = q.find('.testpaper-question-result strong.color-success').text().trim();
    const analysis = q.find('.testpaper-question-analysis .well').text().trim();

    questions.push({
        id: id,
        type: 'multiple',
        stem: stem,
        options: options,
        answer: answerText,
        analysis: analysis
    });
});

// Parse Determine (True/False)
$('#testpaper-questions-determine .testpaper-question').each((i, el) => {
    const q = $(el);
    const id = q.attr('id');
    const stem = q.find('.testpaper-question-stem').text().trim();
    const answerText = q.find('.testpaper-question-result strong.color-success').text().trim();
    const analysis = q.find('.testpaper-question-analysis .well').text().trim();

    questions.push({
        id: id,
        type: 'determine',
        stem: stem,
        options: ['正确', '错误'],
        answer: answerText,
        analysis: analysis
    });
});

// Parse Fill (if exists)
$('#testpaper-questions-fill .testpaper-question').each((i, el) => {
    const q = $(el);
    const id = q.attr('id');
    const stem = q.find('.testpaper-question-stem').text().trim();
    const answerText = q.find('.testpaper-question-result strong.color-success').text().trim();
    const analysis = q.find('.testpaper-question-analysis .well').text().trim();

    questions.push({
        id: id,
        type: 'fill',
        stem: stem,
        options: [],
        answer: answerText,
        analysis: analysis
    });
});

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2), 'utf-8');

console.log(`Successfully parsed ${questions.length} questions and saved to dist/questions.json.`);
