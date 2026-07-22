class Todo {
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTasks: '[data-js-todo-total-tasks]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckbox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-item-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  }

  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
  }

  localStorageKey = 'todo-items' // Ключ, по которому мы будем получать и сохранять данные из браузерного локального храналища.

  constructor() {
    this.rootElement = document.querySelector(this.selectors.root)
    this.newTaskFormElement = this.rootElement.querySelector(this.selectors.newTaskForm)
    this.newTaskInputElement = this.rootElement.querySelector(this.selectors.newTaskInput)
    this.searchTaskFormElement = this.rootElement.querySelector(this.selectors.searchTaskForm)
    this.searchTaskInputElement = this.rootElement.querySelector(this.selectors.searchTaskInput)
    this.totalTasksElement = this.rootElement.querySelector(this.selectors.totalTasks)
    this.deleteAllButtonElement = this.rootElement.querySelector(this.selectors.deleteAllButton)
    this.listElement = this.rootElement.querySelector(this.selectors.list)
    this.emptyMessageElement = this.rootElement.querySelector(this.selectors.emptyMessage)
    this.state = {
      items: this.getItemsFromLocalStorage(), /* (актуальное состояние ту ду листа) массив объектов с данными для каждого элемента (Id, заголовок, isChecked) */
      filteredItems: null, // Свойство будет отвечать за отфильтрованные элементы (после совершения поиска)
      searchQuery: '', // Текст поискового запроса
    }
    this.render() // В случае, когда localStorage не пустой, отрисовать задачи после загрузки страницы.
    this.bindEvents()
  }
  /* 
    Цель: получить данные из localStorage и вернуть их, если они есть,
    либо вернуть пустой массив в качестве начального (исходного) значения для state.items
  */
  getItemsFromLocalStorage = () => {
    const rawData = localStorage.getItem(this.localStorageKey)

    if (!rawData) {
      return []
    }

    try {
      const parseData = JSON.parse(rawData)

      return Array.isArray(parseData) ? parseData : []
    } catch {
      console.error('Todo items parse error')
      return []
    }
  }

  // Метод обновляет данные в локальном браузерном хранилище
  saveItemsToLocalStorage = () => {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.state.items)
    )
  }

  // Метод обновляет DOM-дерево в соответствии с новыми данными в state объекте
  render() {
    /*
      Обновить состояние:
        1. totalTasksElement
        2. deleteAllButtonElement
        3. listElement
        4. emptyMessageElement
    */
    this.totalTasksElement.textContent = this.state.items.length

    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible, this.state.items.length > 0
    )

    // Переменная, по сути, точка принятия решения, что сейчас показывать пользователю
    const items = this.state.filteredItems ?? this.state.items

    this.listElement.innerHTML = items.map(({ id, title, isChecked }) => (`
        <li class="todo__item todo-item" data-js-todo-item>
          <input
            class="todo-item__checkbox"
            id="${id}"
            type="checkbox"
            ${isChecked ? 'checked' : ''}
            data-js-todo-item-checkbox
          />
          <label
            class="todo-item__label"
            for="${id}"
            data-js-todo-item-label
          >
            ${title}
          </label>
          <button
            class="todo-item__delete-button"
            type="button"
            aria-label="Delete"
            title="Delete"
            data-js-todo-item-delete-button
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#757575"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </li>
      `)).join('') // Избавляемся от лишних символов запятой между элементами todo__item

    const isEmptyFilteredItems = this.state.filteredItems?.length === 0
    const isEmptyItems = this.state.items.length === 0

    this.emptyMessageElement.textContent =
      isEmptyFilteredItems ? 'Tasks not found'
      : isEmptyItems ? 'There are no tasks yet' : ''
  }

  /*
    Ниже методы для манипуляции полем items в state объекте
  */

  addItem(title) {
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    })
    this.saveItemsToLocalStorage()
    this.render()
  }

  deleteItem(id) {
    this.state.items = this.state.items.filter((item) => (item.id !== id))
    this.saveItemsToLocalStorage()
    this.render()
  }

  toggleCheckedState(id) {
    this.state.items = this.state.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isChecked: !item.isChecked
        }
      }

      return item
    })

    this.saveItemsToLocalStorage()
    this.render()
  }

  filter() {
    const queryFormatted = this.state.searchQuery.toLowerCase()

    this.state.filteredItems = this.state.items.filter(({ title }) => {
      const titleFormatted = title.toLowerCase()

      return titleFormatted.includes(queryFormatted)
    })
    this.render()
  }

  resetFilter() {
    this.state.filteredItems = null
    this.state.searchQuery = ''
    this.render()
  }

  onNewTaskFormSubmit = (event) => {
    event.preventDefault()

    const newTodoItemTitle = this.newTaskInputElement.value

    if (newTodoItemTitle.trim().length > 0) {
      this.addItem(newTodoItemTitle)
      this.resetFilter()
      this.newTaskInputElement.value = ''
      this.newTaskInputElement.focus()
    }
  }

  onSearchTaskFormSubmit = (event) => {
    event.preventDefault()
  }

  onSearchTaskInputChange = ({ target }) => {
    const value = target.value.trim()

    if (value.length > 0) {
      this.state.searchQuery = value
      this.filter()
    } else {
      this.resetFilter()
    }
  }

  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Are you sure you want to delete all tasks?')


    if (isConfirmed) {
      this.state.items = []
      this.saveItemsToLocalStorage()
      this.render()
    }
  }

  onClick = ({ target }) => {
    if (target.matches(this.selectors.itemDeleteButton)) {
      const itemElement = target.closest(this.selectors.item)
      const itemCheckboxElement = itemElement.querySelector(this.selectors.itemCheckbox)

      itemElement.classList.add(this.stateClasses.isDisappearing)

      setTimeout(() => {
        this.deleteItem(itemCheckboxElement.id)
      }, 400)
    }
  }

  onChange = ({ target }) => {
    if (target.matches(this.selectors.itemCheckbox)) {
      this.toggleCheckedState(target.id)
    }
  }

  bindEvents() {
    this.newTaskFormElement.addEventListener('submit', this.onNewTaskFormSubmit)
    this.searchTaskFormElement.addEventListener('submit', this.onSearchTaskFormSubmit)
    this.searchTaskInputElement.addEventListener('input', this.onSearchTaskInputChange)
    this.deleteAllButtonElement.addEventListener('click', this.onDeleteAllButtonClick)
    this.listElement.addEventListener('click', this.onClick)
    this.listElement.addEventListener('change', this.onChange)
  }
}

new Todo()
