let exercises = [];
const logForm = document.getElementById('log-form');
const saveButton = document.getElementById('save-button');
const summaryDiv = document.getElementById('summary');

// データ読み込み
fetch('./data/exercises.json')
  .then(res => res.json())
  .then(data => {
    exercises = data;
    renderForm();
    loadTodayLog();
  });

function renderForm() {
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  logForm.innerHTML = exercises.map(ex => `
    <div>
      <label>${ex.name}（セット数）</label>
      <input type="number" id="${ex.id}" min="0" value="0" />
    </div>
  `).join('');
}

function saveLog() {
  const today = new Date().toISOString().slice(0, 10);
  const log = exercises.map(ex => ({
    id: ex.id,
    sets: Number(document.getElementById(ex.id).value)
  }));
  localStorage.setItem(`log-${today}`, JSON.stringify(log));
  alert('保存しました');
  loadTodayLog();
}

function loadTodayLog() {
  const today = new Date().toISOString().slice(0, 10);
  const log = JSON.parse(localStorage.getItem(`log-${today}`)) || [];
  summaryDiv.innerHTML = '<h2>本日の記録</h2>' + log.map(entry => {
    const ex = exercises.find(e => e.id === entry.id);
    return `<div>${ex.name}：${entry.sets}セット</div>`;
  }).join('');
}

saveButton.addEventListener('click', saveLog);


// インポート機能
function exportLogs() {
    const logs = {};
    for (let key in localStorage) {
      if (key.startsWith('log-')) {
        logs[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout-logs.json';
    a.click();
  }
  

// エクスポート機能
function importLogs(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const logs = JSON.parse(e.target.result);
      for (let key in logs) {
        localStorage.setItem(key, JSON.stringify(logs[key]));
      }
      alert('インポート完了！');
      loadTodayLog(); // 当日のログを再表示
    };
    reader.readAsText(file);
  }
  
// グラフ描画用に直近７日のデータを取得
function getLast7DaysLogs() {
    const logs = [];
    const today = new Date();
  
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const log = JSON.parse(localStorage.getItem(`log-${dateStr}`)) || [];
  
      logs.push({
        date: dateStr,
        log
      });
    }
  
    return logs;
  }

  // 特定の運動の合計セット数（例： pushup ）
  function getWeeklyDataForExercise(exerciseId) {
    const logs = getLast7DaysLogs();
    const labels = [];
    const data = [];
  
    for (let entry of logs) {
      const date = new Date(entry.date);
      labels.push(`${date.getMonth()+1}/${date.getDate()}`);
      const exLog = entry.log.find(l => l.id === exerciseId);
      data.push(exLog ? exLog.sets : 0);
    }
  
    return { labels, data };
  }

  // Chart.js でグラフ描画（棒グラフ）
  function renderWeeklyChart(exerciseId, exerciseName) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const { labels, data } = getWeeklyDataForExercise(exerciseId);
  
    new Chart(ctx, {
      type: 'bar', // 棒グラフ
      //type: 'line', // 折れ線グラフ
      data: {
        labels: labels,
        datasets: [{
          label: `${exerciseName}（週間）`,
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            stepSize: 1
          }
        }
      }
    });
  }
  