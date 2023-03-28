'use strict';

// Elements
const sidebar = document.querySelector('.sidebar');
const modal = document.querySelector('.modal-warning');
const closeModalBtn = document.querySelector('.modal-close');
const form = document.querySelector('.send_form');
const updateForm = document.querySelector('.update_form');
const formBtn = document.querySelector('.form__btn');
const deleteBtn = document.querySelector('.delete_btn');
const updateBtn = document.querySelector('.update__btn');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');
const inputFilter = document.querySelector('.filter__input');
const inputChangeType = document.querySelector(
  '.update_form .form__input--type'
);
const inputChangeDistance = document.querySelector(
  '.update_form .form__input--distance'
);
const inputChangeDuration = document.querySelector(
  '.update_form .form__input--duration'
);
const inputChangeTemp = document.querySelector(
  '.update_form .form__input--temp'
);
const inputChangeClimb = document.querySelector(
  '.update_form .form__input--climb'
);

// Code
class Workout {
  // date = new Date();
  id = new Date().getTime();
  clickNumber = 0;
  constructor(coords, distance, duration, date = new Date()) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.date = date;
  }
  _setDescription() {
    const workoutDate = `${new Intl.DateTimeFormat('ru-Ru').format(
      new Date(this.date)
    )}`;
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
  constructor(coords, distance, duration, temp, date) {
    super(coords, distance, duration, date);
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
  constructor(coords, distance, duration, climb, date) {
    super(coords, distance, duration, date);
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
  #currentElement;
  #targetWorkout;
  constructor() {
    this._getPosition();
    sidebar.addEventListener('click', this._closeForms.bind(this));
    formBtn.addEventListener('click', this._newWorkout.bind(this));
    // form.addEventListener('submit', this._newWorkout.bind(this));
    // updateForm.addEventListener('submit', this._updateWorkout.bind(this));
    updateBtn.addEventListener('click', this._updateWorkout.bind(this));
    deleteBtn.addEventListener('click', this._deleteAll.bind(this));
    inputType.addEventListener('change', this._toggleClimbField.bind(this));
    inputFilter.addEventListener('change', this._filterWorkouts.bind(this));
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._changeWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    this._getLSData();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        this._showWarning.bind(this)
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
  _areNumbers(...numbers) {
    return numbers.every(num => Number.isFinite(num));
  }
  _areNumbersPositive(...numbers) {
    return numbers.every(num => num > 0);
  }
  _newWorkout(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    // const areNumbers = (...numbers) =>
    //   numbers.every(num => Number.isFinite(num));
    // const areNumbersPositive = (...numbers) => numbers.every(num => num > 0);
    let workout;
    // Form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    // Checking data
    if (type === 'running') {
      const temp = +inputTemp.value;
      if (
        !this._areNumbers(distance, duration, temp) ||
        !this._areNumbersPositive(distance, duration, temp)
      )
        return alert('Введите положительное число');
      workout = new Running([lat, lng], distance, duration, temp);
    }
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      if (
        !this._areNumbers(distance, duration, climb) ||
        !this._areNumbersPositive(distance, duration)
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
  _displayWorkoutOnSidebar(workout, type = 'add') {
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
    if (type === 'add') {
      containerWorkouts.insertAdjacentHTML('beforeend', html);
    }
    if (type == 'update') {
      this.#currentElement.insertAdjacentHTML('afterend', html);
    }
    deleteBtn.classList.remove('hidden');
    if (containerWorkouts.querySelectorAll('li').length >= 2) {
      inputFilter.classList.remove('hidden');
    }
  }
  _moveToWorkout(e) {
    e.stopPropagation();
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
    data.forEach(obj => {
      if (obj.type === 'running') {
        const newObj = new Running(
          obj.coords,
          obj.distance,
          obj.duration,
          obj.temp,
          obj.date
        );
        newObj.id = obj.id;
        this.#workouts.push(newObj);
      }
      if (obj.type === 'cycling') {
        const newObj = new Cycling(
          obj.coords,
          obj.distance,
          obj.duration,
          obj.climb,
          obj.date
        );
        newObj.id = obj.id;
        this.#workouts.push(newObj);
      }
    });
    // this.#workouts = data;
    this.#workouts.forEach(workout => this._displayWorkoutOnSidebar(workout));
  }
  _changeWorkout(e) {
    e.stopPropagation();
    if (e.target.classList.contains('change')) {
      this.#currentElement = e.target.closest('.workout');
      this.#targetWorkout = this.#workouts.find(
        item => item.id === +this.#currentElement.dataset.id
      );
      updateForm.classList.remove('hidden');
      // Подставляем имеющиеся значения в форму
      inputChangeType.value = this.#targetWorkout.type;
      inputChangeDuration.value = this.#targetWorkout.duration;
      inputChangeDistance.value = this.#targetWorkout.distance;
      if (this.#targetWorkout.type === 'running') {
        inputChangeTemp.value = this.#targetWorkout.temp;
      }
      if (this.#targetWorkout.type === 'cycling') {
        inputChangeClimb
          .closest('.form__row')
          .classList.toggle('form__row--hidden');
        inputChangeTemp
          .closest('.form__row')
          .classList.toggle('form__row--hidden');
        inputChangeClimb.value = this.#targetWorkout.climb;
      }
    }
  }
  _updateWorkout(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.classList.contains('update__btn')) {
      // Считать данные и подставить их в тренировку
      const type = inputChangeType.value;
      const distance = +inputChangeDistance.value;
      this.#targetWorkout.distance = distance;
      const duration = +inputChangeDuration.value;
      this.#targetWorkout.duration = duration;
      if (type === 'running') {
        const temp = +inputChangeTemp.value;
        this.#targetWorkout.temp = temp;
        this.#targetWorkout.pace = duration / distance;
        if (
          !this._areNumbers(distance, duration, temp) ||
          !this._areNumbersPositive(distance, duration, temp)
        )
          return alert('Введите положительное число');
      }
      if (type === 'cycling') {
        const climb = +inputChangeClimb.value;
        this.#targetWorkout.climb = climb;
        this.#targetWorkout.speed = distance / duration / 60;
        if (
          !this._areNumbers(distance, duration, climb) ||
          !this._areNumbersPositive(distance, duration)
        )
          return alert('Введите положительное число');
      }
      // Изменить LS
      this._addWorkoutsToLS();
      // Перерисовать sidebar
      this._displayWorkoutOnSidebar(this.#targetWorkout, 'update');
      this.#currentElement.remove();
      // Скрыть форму
      updateForm.classList.add('hidden');
    }
  }
  _deleteWorkout(e) {
    e.stopPropagation();
    if (e.target.classList.contains('cross')) {
      const workoutElement = e.target.closest('.workout');
      const targetWorkout = this.#workouts.find(
        item => item.id === +workoutElement.dataset.id
      );
      this.#workouts.splice(this.#workouts.indexOf(targetWorkout), 1);
      this._addWorkoutsToLS();
      workoutElement.remove();
      L.marker(targetWorkout.coords).closePopup().unbindPopup().remove();
      if (containerWorkouts.querySelectorAll('li').length == 0) {
        deleteBtn.classList.add('hidden');
      }
    }
  }
  _deleteAll(e) {
    e.preventDefault();
    e.stopPropagation();
    const allLines = containerWorkouts.querySelectorAll('li');
    allLines.forEach(item => item.remove());
    this.#workouts = [];
    this._addWorkoutsToLS();
    deleteBtn.classList.add('hidden');
    inputFilter.classList.add('hidden');
    location.reload();
  }
  _filterWorkouts(e) {
    e.stopPropagation();
    const filterBase = inputFilter.value;
    containerWorkouts.querySelectorAll('li').forEach(li => li.remove());
    this.#workouts.sort((prev, next) => {
      switch (filterBase) {
        case 'duration':
          return prev.duration - next.duration;
          break;
        case 'distance':
          return prev.distance - next.distance;
          break;
        case 'time':
          return prev.date - next.date;
          break;
      }
    });
    this.#workouts.forEach(obj => this._displayWorkoutOnSidebar(obj));
  }
  _closeForms(e) {
    if (e.target.classList.contains('sidebar')) {
      e.target.querySelectorAll('.form').forEach(form => {
        if (!form.classList.contains('hidden')) {
          form.classList.add('hidden');
        }
      });
    }
  }
  _showWarning() {
    modal.style.display = 'block';
    closeModalBtn.addEventListener('click', function () {
      modal.style.display = 'none';
      location.reload();
    });
  }
}

const app = new App();
