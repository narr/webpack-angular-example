/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */

'use strict';

angular.module('todomvc')
  .controller('TodoCtrl', function TodoCtrl(store, $scope, $filter, $routeParams, labelGroup, $location) {

    const vm = this;
    vm.todos = $scope.todos = store.todos; // $scope.todos => to watch todos by $scope.$watch
    vm.newTodo = '';
    vm.editedTodo = null;

    $scope.$watch('todos', () => {
      vm.remainingCount = $filter('filter')(vm.todos, {
        completed: false
      }).length;
      vm.completedCount = vm.todos.length - vm.remainingCount;
      vm.allChecked = !vm.remainingCount;
    }, true);

    // Monitor the current route for changes and adjust the filter accordingly.
    $scope.$on('$routeChangeSuccess', (e, current, previous) => {
      const status = vm.status = $routeParams.status || '';
      if (status === 'active') {
        vm.statusFilter = {
          completed: false
        };
      } else if (status === 'completed') {
        vm.statusFilter = {
          completed: true
        };
      } else {
        vm.statusFilter = {};
        if (status) {
          $location.path('/').replace();
        }
      }
    });

    vm.addTodo = () => {
      const newTodo = {
        title: vm.newTodo.trim(),
        completed: false
      };

      if (!newTodo.title) {
        return;
      }

      vm.saving = true;
      store.insert(newTodo)
        .then(function success() {
          vm.newTodo = '';
        })
        .finally(() => {
          vm.saving = false;
        });
    };

    vm.editTodo = (todo) => {
      vm.editedTodo = todo;
      // Clone the original todo to restore it on demand.
      vm.originalTodo = angular.extend({}, todo);
    };

    vm.saveEdits = (todo, event) => {
      // Blur events are automatically triggered after the form submit event.
      // This does some unfortunate logic handling to prevent saving twice.
      if (event === 'blur' && vm.saveEvent === 'submit') {
        vm.saveEvent = null;
        return;
      }

      vm.saveEvent = event;

      if (vm.reverted) {
        // Todo edits were reverted-- don't save.
        vm.reverted = null;
        return;
      }

      todo.title = todo.title.trim();

      if (todo.title === vm.originalTodo.title) {
        vm.editedTodo = null;
        return;
      }

      store[todo.title ? 'put' : 'delete'](todo)
        .then(function success() {}, function error() {
          todo.title = vm.originalTodo.title;
        })
        .finally(() => {
          vm.editedTodo = null;
        });
    };

    vm.revertEdits = (todo) => {
      vm.todos[vm.todos.indexOf(todo)] = vm.originalTodo;
      vm.editedTodo = null;
      vm.originalTodo = null;
      vm.reverted = true;
    };

    vm.removeTodo = (todo) => {
      store.delete(todo);
    };

    vm.toggleCompleted = (todo, completed) => {
      if (angular.isDefined(completed)) {
        todo.completed = completed;
      }
      store.put(todo, vm.todos.indexOf(todo))
        .then(function success() {}, function error() {
          todo.completed = !todo.completed;
        });
    };

    vm.clearCompletedTodos = () => {
      store.clearCompleted();
    };

    vm.markAll = (completed) => {
      vm.todos.forEach((todo) => {
        if (todo.completed !== completed) {
          vm.toggleCompleted(todo, completed);
        }
      });
    };

    vm.loadChunks = () => {
      if (!labelGroup.isCalled) {
        labelGroup.isCalled = true;
        /*
        Promise.all(['module1', 'module2', 'module3']
          .map(x => System.import(x))) // https://webpack.github.io/docs/code-splitting.html#es6-modules
          .then(([module1, module2, module3]) => {
            // Use module1, module2, module3
          });
        */
        require.ensure([], (require) => { // can't use 'import' in require.ensure
          require('label/label.scss');
          const LoadJSON = require('label/loadJSON').default;
          labelGroup.loadHtml = new LoadJSON();
          labelGroup.setHtml();
        }, 'label-chunk');
      }
    };
  });
