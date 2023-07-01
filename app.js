const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://locahost:3000/");
    });
  } catch (error) {
    console.log(`Db Error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//api 1
app.get("/todos/", async (request, response) => {
  const { status } = request.query;
  const gettingTodoQuery = `
    select * 
    from todo
    where status= '%${status}%'
    ;`;
  const todoArray = await db.all(gettingTodoQuery);
  response.send(todoArray);
});

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let getToDoQuery = "";
  let data = null;
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getToDoQuery = `
      select 
          * 
      from 
          todo
      where todo like '%${search_q}%'
          and status = '${status}'
          and priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getToDoQuery = ` 
      select 
          *
      from 
          todo 
      where 
          todo like '%${search_q}%'
          and priority = '%${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getToDoQuery = `
      select
          * 
      from 
          todo 
      where 
          todo like '%${search_q}%'
          and status = '${status}';`;
  }
  data = await db.all(getToDoQuery);
  response.send(data);
});

//api 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    select 
        * 
    from 
        todo
    where id = ${todoId};`;
  const todoSingleItem = await db.get(getTodoQuery);
  response.send(todoSingleItem);
});
//api 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addingQuery = `
    insert into 
    todo (id, todo, priority, status)
    values('${id}', '${todo}', '${priority}', '${status}');
    `;
  await db.run(addingQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";

      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";

    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    select * 
    from todo 
    where id = ${todoId};`;
  const previousTodo = await db.run(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateQuery = `
    update todo 
    set 
        todo='${todo}',
        priority='${priority}',
        status ='${status}'
    where 
        id = ${todoId};`;
  await db.run(updateQuery);
  response.send("Todo Updated");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete 
    from todo 
    where id = ${todoId};
    `;
  const deleteTodo = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
