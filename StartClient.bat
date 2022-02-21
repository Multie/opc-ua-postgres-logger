@echo off

start cmd /c tsc -p d:\Users\multi\Projects\OPC-DB-Logger\tsconfig.json --watch

nodemon --ignore ./config out/app.js 