import * as React from 'react';
import {Context} from './types';
import createPolarisContext from './utilities/createPolarisContext';

const {Provider, Consumer} = React.createContext<Context>({
  ...createPolarisContext(),
});

export {Provider, Consumer};
