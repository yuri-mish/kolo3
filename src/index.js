import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { WebSocketLink } from 'apollo-link-ws';
import { ApolloClient, ApolloProvider } from "@apollo/client";
import {InMemoryCache} from 'apollo-cache-inmemory';

//const link = 
const Aclient = new ApolloClient({
  cache: new InMemoryCache(),
  link:  new WebSocketLink({
    uri: `wss://otkapi.vioo.com.ua/ws`,
    options: {
      reconnect: true
    }
  })
}) ;

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={Aclient}>
       <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
