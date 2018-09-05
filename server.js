const express = require('express');
const chalk = require('chalk');

const app = express();

const host = '127.0.0.1';
const port = 9527;

app.use(express.static('./public'));

app.listen(port, () => {
  console.log(chalk.bgGreen(`Server running at http://${host}:${port}/`));
});