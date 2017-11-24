// retain page view when editing a completed todo
var toDoList = {
  init: function() {
    this.mainItemsSource = $('#todo-item').html();
    this.mainItemsTemplate = Handlebars.compile(this.mainItemsSource);
    this.toDosSource = $('#nav-todos-template').html();
    this.completedSource = $('#completed-todos-template').html();
    this.initialiseStorage();
    this.CompletedToDosNavObj;
    this.allToDosNavObj;
    this.completedToDos;
    this.listType = 'all';
    this.itemClicked = 'All Todos';
    this.refreshPage();
  },
  updateCompletedTotal: function(dataCompleted) {
    $('#completed_todos_heading').next().text(dataCompleted.length.toString());
  },
  initialiseStorage: function() {
    if (localStorage.getItem('todolist') === null) {
      localStorage.setItem('todolist', '[]');
    }
    $('#main_count').text(JSON.parse(localStorage.getItem('todolist')).length);
  },
  setHeadingInfo: function() {
    $('#main_heading').text(this.itemClicked);
    $('#main_count').text($('.main_table tbody').find('label').length);
  },
  bindEvents: function() {
    // this var affects how the modal is invoked, new todo = undefined, todo id x = x
    var toDoIdForEdit;
    this.bindDeletions.call(this);
    this.bindToDoEdits();
    $('.main_table thead th').on('click', this.invokeModal.bind(this, toDoIdForEdit));
    $('.toggle').on('click', this.toggleCompletion.bind(this));
    $('nav dl').on('click', this.selectFromNav.bind(this));
  },
  bindToDoEdits: function() {
    $('.item').on('click', this.openTodo.bind(this));
  },
  bindDeletions: function() {
    $('.delete').on('click', this.deleteItem.bind(this));
  },
  refreshPage: function() {
    this.renderViewportItems();
    this.bindEvents();
  },
  renderViewportItems: function() {
    var data = JSON.parse(localStorage.getItem('todolist'));
    this.updateCollections(data);
    this.populateNavItems(this.allToDosNavObj, this.completedToDosNavObj, data);
    if (this.listType === undefined) {
      $('.main_table tbody').html(this.mainItemsTemplate(data));
    } else {
      this.renderRefinedItems();
    }
    this.markCompleteItems(data);
    this.setNavHighlight();
  },
  renderRefinedItems: function() {
    var itemDate = this.itemClicked;
    var data = JSON.parse(localStorage.getItem('todolist'));
    this.sortCompletedItems(data);
    this.processMainListByNavSelection(data);
    this.setHeadingInfo();
  },
  processMainListByNavSelection: function(data) {
    if (this.itemClicked === "All Todos") {
      $('.main_table tbody').html(this.mainItemsTemplate(data));
    } else if (this.listType === 'all') {
      $('.main_table tbody').html(this.mainItemsTemplate(this.filterToDosByDate(data, this.itemClicked)));
    } else if (this.listType === 'completed' && this.itemClicked === 'Completed') {
      $('.main_table tbody').html(this.mainItemsTemplate(this.completedToDos));
    } else if (this.listType === 'completed') {
      $('.main_table tbody').html(this.mainItemsTemplate(this.filterToDosByDate(this.completedToDos, this.itemClicked)));
    }
  },
  filterToDosByDate: function(collection, itemDate) {
    var result = collection.filter(function(obj) {
        if (obj.date === itemDate) {
          return true;
        }
      });
    return result;
  },
  markCompleteItems: function(data) {
    $.each(data, function(index, obj) {
      var thisLabelElement = $('.main_table').find('input#' + obj.id).next();
      thisLabelElement.removeClass('completed');
      if (obj.completed === true) {
        thisLabelElement.addClass('completed');
      }
    });
  },
  sortCompletedItems: function(data) {
    data.sort(function(a, b) {
      if ((a.completed && b.completed) || (!a.completed && !b.completed)) {
        return 0;
      } else if (a.completed && !b.completed) {
        return 1;
      } else if (!a.completed && b.completed) {
        return -1;
      }
    });
  },
  setNavHighlight: function() {
    $('nav dl').removeClass('selection');
    if (this.listType === undefined) {
      this.itemClicked = 'All Todos';
      $('.nav_todos dl dd:contains(All Todos)').closest('dl').addClass('selection');
    } else if (this.listType === 'all') {
      $('.nav_todos dl dd:contains(' + this.itemClicked + ')').closest('dl').addClass('selection');
    } else if (this.listType === 'completed') {
      $('.completed_todos dl dd:contains(' + this.itemClicked + ')').closest('dl').addClass('selection');
    }
  },
  toggleCompletion: function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    $(event.target).find('label').toggleClass('completed');
    var thisId = Number($(event.target).find('input').attr('id'));
    var collection = JSON.parse(localStorage.getItem('todolist'));
    var result = collection.map(function(obj) {
      if (obj.id === thisId) {
        obj.completed = !(obj.completed);
      }
      return obj;
    });
    localStorage.setItem('todolist', JSON.stringify(result));
    this.refreshPage();
  },
  deleteItem: function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var thisId = Number($(event.target).parents('tr').find('input').attr('id'));
    var collection = JSON.parse(localStorage.getItem('todolist'));
    var result = collection.filter(function(obj) {
      if (obj.id !== thisId) {
        return obj;
      }
    });
    localStorage.setItem('todolist', JSON.stringify(result));
    this.refreshPage();
  },
  openTodo: function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.invokeModal(Number($(event.target).attr("for")));
  },
  invokeModal: function(todoId) {
    $('.background').fadeIn('slow');
    $('.background').css('background', 'rgba(0,0,0,0.5)');
    Object.create(Modal).init(todoId);
  },
  updateTotalItems: function(data) {
    $('#nav_todos_heading').next().text(data.length.toString());
  },
  selectFromNav: function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();

    if ($(event.target).closest($('div')).hasClass('completed_todos')) {
      this.displayFromCompletedList();
    } else {
      this.displayFromToDoList();
    }
  },
  displayFromCompletedList: function() {
    this.itemClicked = $(event.target).closest($('dl')).find('dd').text();
    this.listType = 'completed';
    this.refreshPage();
  },
  displayFromToDoList: function() {
    this.itemClicked = $(event.target).closest($('dl')).find('dd').text();
    this.listType = 'all';
    this.refreshPage();
  },
  updateCollections: function(data) {
    this.updateCompletedItems(data);
    this.allToDosNavObj = this.sortDataByDate(data);
    this.completedToDosNavObj = this.sortDataByDate(this.completedToDos);
  },
  populateNavItems: function(toDosObj, completedObj, data) {
    this.populateToDos(toDosObj);
    this.populatedCompleteds(completedObj);
    this.updateCompletedTotal(this.completedToDos);
    this.updateTotalItems(data);
  },
  updateCompletedItems: function(data) {
    var dataCompleted = [];
    data.forEach(function(obj) {
      if (obj.completed) {
        dataCompleted.push(obj);
      }
    });
    this.completedToDos = dataCompleted;
  },
  populateToDos: function(toDosObj) {
    if (toDosObj.length === 0) {
      toDosObj = {dummyObj: ""};
    }
    this.toDosTemplate = Handlebars.compile(this.toDosSource);
    $('.nav_todos').html(this.toDosTemplate(toDosObj));
  },
  populatedCompleteds: function(completedObj) {
    if (completedObj.length === 0) {
      completedObj = {dummyObj: ""};
    };
    this.completedSourceTemplate = Handlebars.compile(this.completedSource);
    $('.completed_todos').html(this.completedSourceTemplate(completedObj));
  },
  sortDataByDate: function(data) {
    var dates = [];
    var todos = [];
    data.forEach(function(obj) {
      if (dates.indexOf(obj.date) === -1) {
        dates.push(obj.date);
        todos.push([obj]);
      } else {
        todos.forEach(function(todo) {
          if (todo[0].date === obj.date) {
            todo.push(obj);
          }
        });
      }
    });

    return this.formatAsHbarsObj(dates, todos);
  },
  formatAsHbarsObj: function(dates, todos) {
    var result = [];
    for (var i = 0; i < dates.length; i += 1) {
      var newObj = {};
      newObj["date"] = dates[i];
      newObj["count"] = todos[i].length;
      result.push(newObj);
    }
    return result;
  },
};

var Modal = {
  init: function(todoId) {
    this.bindModalEvents(todoId);
    this.populateForm(todoId);
  },
  bindModalEvents: function(todoId) {
    $('.background').on('click', this.hideModal.bind(this));
    $('.form').click(function(event) {event.stopPropagation()});    
    $('#save').on('click', this.submitFormSave.bind(this, todoId));
    $('#complete').on('click', this.submitFormComplete.bind(this, todoId));
  },
  getNextId: function() {
    var data = JSON.parse(localStorage.getItem('todolist'));
    if (data.length === 0) { 
      return 1;
    } else {
      var data = JSON.parse(localStorage.getItem('todolist')).map(function(obj) {
        return obj.id;
      });
      return Math.max.apply(null, data) + 1;
    }
  },
  populateForm: function(todoId) {
    if (todoId) {
      var data = (JSON.parse(localStorage.getItem('todolist')));
      data = data.filter(function(todoObj) {
          return todoObj.id === todoId;
      })[0];
      this.setInputFields(data);
      $('#title').attr('placeholder', 'Item1');
    } else if (todoId === undefined) {
      this.setInputFields();
      $('#title').attr('placeholder', 'Item1');
    }
  },
  setInputFields: function(data) {
    if (data) {
    $('#title').val(data.title);
      $('#day').val(data.day);
      $('#month').val(data.month);
      $('#year').val(data.year);
      $('#description').val(data.description);
    } else {
      $('#title').val('');
      $('#day').val('');
      $('#month').val('');
      $('#year').val('');
      $('#description').val('');
    }
  },
  submitFormSave: function(id, event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (id) {
      this.updateInStorage(id);
    } else if (id === undefined) {
      this.createNewToDo();
      toDoList.itemClicked = "All Todos";
      toDoList.listType = 'all';
    }
    // toDoList.itemClicked = "All Todos";
    // toDoList.listType = 'all';
    this.hideModal();
  },
  submitFormComplete: function(id, event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (id === undefined) {
      alert("The ToDo must be created first!")
    } else {
      this.hideModal();
      this.setItemComplete(id);
    }
  },
  setItemComplete: function(id) {
    var thisId = id;
    var collection = JSON.parse(localStorage.getItem('todolist'));
    var result = collection.map(function(obj) {
      if (obj.id === thisId) {
        obj.completed = true;
      }
      return obj;
    });
    localStorage.setItem('todolist', JSON.stringify(result));
    this.hideModal();
  },
  updateInStorage: function(id) {
    var todo = $('form').serializeArray();
    var thisId = id;
    todo.push({ name: "id", value: thisId, });
    var newToDo = Object.create(ToDo).init(todo);
    var collection = (JSON.parse(localStorage.getItem('todolist')));
    // searches todos, and gets new object for only the todo to edit
    var result = collection.map(function(todo) { 
      if (todo.id !== thisId) {
        return todo;
      } else {
        newToDo.completed = todo.completed;
        return newToDo;
      }
    });
    localStorage.setItem('todolist', JSON.stringify(result));
  },
  createNewToDo: function() {
    var todo = $('form').serializeArray();
    var thisId = this.getNextId();
    todo.push({ name: "id", value: thisId, });
    var newToDo = Object.create(ToDo).init(todo);
    var collection = (JSON.parse(localStorage.getItem('todolist')));
    collection.push(newToDo);
    localStorage.setItem('todolist', JSON.stringify(collection));
  },
  hideModal: function(event) {
    $('.background').fadeOut('fast');
    $('.background').css('background', 'rgba(0,0,0,0)');
    $('#save').off();
    $('#complete').off();
    toDoList.refreshPage();
  },
};

var ToDo = {
  init: function(parameters) {
    this.result = {};
    for (var i = 0; i < parameters.length; i += 1) {
      this.result[parameters[i].name] = parameters[i].value;
    }
    this.result.completed = false;
    this.result.date = this.fillMissingDate(this.result);
    return this.result;
  },
  fillMissingDate: function(todo) {
    if (todo.month !== "" && todo.year !== "") {
      return todo.month + '/' + todo.year.replace(/^\d\d/, '');
    } else {
      return "No Due Date";
    }
  },
};

$(function () {
  toDoList.init();
});