// pages/index.js
import React from 'react';
import withESI from 'react-esi/lib/withESI';
import MyFragment from '../components/MyFragment';

const MyFragmentESI = withESI(MyFragment, 'MyFragment');
// The second parameter is an unique ID identifying this fragment.
// If you use different instances of the same component, use a different ID per instance.

const App = () => (
  <div>
    <h1>React ESI demo app</h1>
    <MyFragmentESI greeting="Hello!" />
  </div>
);

export default App