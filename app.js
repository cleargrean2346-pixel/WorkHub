const toast = document.querySelector('.toast');
const showToast = () => { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2800); };
document.querySelector('#createTask').addEventListener('click', showToast);
document.querySelector('#addTask').addEventListener('click', showToast);
document.querySelector('.toast button').addEventListener('click', () => toast.classList.remove('show'));
document.querySelectorAll('.task input').forEach(input => input.addEventListener('change', e => {
  const row = e.target.closest('.task'); row.classList.toggle('done', e.target.checked); row.querySelector('.check').textContent = e.target.checked ? '✓' : '';
}));
