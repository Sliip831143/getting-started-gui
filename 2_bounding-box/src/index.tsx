import React from 'react';
import ReactDOM from 'react-dom';
import RectLayer from './RectLayer';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <RectLayer />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
