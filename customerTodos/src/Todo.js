function projectRollup() {
  var todos = Todo.fetch({ limit: -1, include: 'this' }).objs || [];
  var now = new Date();
  var rollup = {};

  todos.forEach(function (todo) {
    var row = rollup[todo.customerProject];
    if (!row) {
      row = rollup[todo.customerProject] = {
        customerProject: todo.customerProject,
        NotStarted: 0,
        InProgress: 0,
        Blocked: 0,
        Done: 0,
        overdue: 0,
      };
    }
    row[todo.status] += 1;
    if (todo.status !== 'Done' && new Date(todo.dueDate) < now) {
      row.overdue += 1;
    }
  });

  return Object.keys(rollup).map(function (project) {
    return rollup[project];
  });
}
