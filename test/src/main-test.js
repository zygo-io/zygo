import mocha from 'mocha';
import chai from 'chai';

import zygoClientTest from './zygo-client-test';

mocha.setup('bdd');
let assert  = chai.assert;

zygoClientTest(assert);

mocha.run();
