'use strict';

// Elements
const form = document.querySelector('.form');
const formBtn = document.querySelector('.form__btn');
const deleteBtn = document.querySelector('.delete_btn');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

// Code
class Workout {
  date = new Date();
  id = new Date().getTime();
  clickNumber = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const workoutDate = `${new Intl.DateTimeFormat('ru-Ru').format(this.date)}`;
    this.type === 'running'
      ? (this.description = `Пробежка ${workoutDate}`)
      : (this.description = `Велотренировка ${workoutDate}`);
  }
  click() {
    this.clickNumber += 1;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }
  calculatePace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }
  calculateSpeed() {
    this.speed = this.distance / this.duration / 60;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    formBtn.addEventListener('click', this._newWorkout.bind(this));
    deleteBtn.addEventListener('click', this._deleteAll.bind(this));
    inputType.addEventListener('change', this._toggleClimbField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._changeWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    this._getLSData();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.log('Неудача');
        }
      );
    }
  }
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => this._displayWorkout(workout));
  }
  _showForm(ev) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapEvent = ev;
  }
  _hideForm() {
    inputDistance.value = inputDuration.value = inputTemp.value = '';
    form.classList.add('hidden');
  }
  _toggleClimbField() {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));
    const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);
    // Form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    // Checking data
    if (type === 'running') {
      const temp = +inputTemp.value;
      if (
        !areNumbers(distance, duration, temp) ||
        !areNumbersPositive(distance, duration, temp)
      )
        return alert('Введите положительное число');
      workout = new Running([lat, lng], distance, duration, temp);
    }
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      if (
        !areNumbers(distance, duration, climb) ||
        !areNumbersPositive(distance, duration)
      )
        return alert('Введите положительное число');
      workout = new Cycling([lat, lng], distance, duration, climb);
    }
    this.#workouts.push(workout);
    this._displayWorkout(workout, type);
    this._displayWorkoutOnSidebar(workout);
    this._hideForm();
    this._addWorkoutsToLS();
  }
  _displayWorkout(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚵‍♂️'} ${workout.description}`
      )
      .openPopup();
  }
  _displayWorkoutOnSidebar(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <h3 class="change">Изменить</h3>
          <div class="cross">x</div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚵‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">м/мин</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👟⏱</span>
            <span class="workout__value">${workout.temp}</span>
            <span class="workout__unit">шаг/мин</span>
          </div>
        </li>
      `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">📏⏱</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">км/ч</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🏔</span>
            <span class="workout__value">${workout.climb}</span>
            <span class="workout__unit">м</span>
          </div>
        </li>
      `;
    }
    containerWorkouts.insertAdjacentHTML('beforeend', html);
  }
  _moveToWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    if (
      !workoutElement ||
      e.target.classList.contains('cross') ||
      e.target.classList.contains('change')
    )
      return;
    const targetWorkout = this.#workouts.find(
      item => item.id == workoutElement.dataset.id
    );
    this.#map.setView(targetWorkout.coords, 15);
    targetWorkout.click();
  }
  _addWorkoutsToLS() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLSData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(workout => this._displayWorkoutOnSidebar(workout));
  }
  _changeWorkout(e) {
    if (e.target.classList.contains('change')) {
      // console.log('needs to be done');
      // Определить тренировку
      // Открыть форму
      // Считать данные
      // Обновить значения тренировки
      // Перерисовать тренировку в сайдбаре
    }
  }
  _deleteWorkout(e) {
    if (e.target.classList.contains('cross')) {
      const workoutElement = e.target.closest('.workout');
      const targetWorkout = this.#workouts.find(
        item => item.id === +workoutElement.dataset.id
      );
      this.#workouts.splice(this.#workouts.indexOf(targetWorkout), 1);
      this._addWorkoutsToLS();
      workoutElement.remove();
      L.marker(targetWorkout.coords).closePopup().unbindPopup().remove();
    }
  }
  _deleteAll(e) {
    e.preventDefault();
    const allLines = containerWorkouts.querySelectorAll('li');
    allLines.forEach(item => item.remove());
    this.#workouts = [];
    this._addWorkoutsToLS();
    location.reload();
  }
}

const app = new App();
