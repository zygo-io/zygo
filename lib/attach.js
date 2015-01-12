import Jspm from 'jspm';
import React from 'react';
import * as zygo from './zygo-server';
import fs from 'fs';

export function generateTitle() {
  return Promise.resolve().then(function() {
    return '<title>' + Zygo.state.route.title + '</title>';
  });
}

//Only async function here.
export function generateBody() {
  return Jspm.import(Zygo.pageComponent).then(function(component) {
    var element = React.createElement(component, Zygo.state);
    return React.renderToString(element);
  });
}

export function generateHeader() {
  return Promise.resolve().then(function() {
    return "";
  });
}

export function generateFooter() {
  return Promise.resolve().then(function() {
    //TODO: serialise here
    return "<script>\n" +
    "System.paths['zygo/*'] = '/zygo_internals/zygo.js';" +
    "System.import('zygo').then(function(zygo) {\n" +
    "  zygo._setInitialState(\n" +
    JSON.stringify(Zygo.state) +
    "  );\n" +
    "});";
  });
}
