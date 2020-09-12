// This is a hack because no amount of googling could show me an uncomplicated
// example on how to pass a navigator between react-native-web components.
// Instead, just create a singleton depending on whether we are in
// web or react-native.
// Everyone hates singletons, but they seem to make lots of stuff easier. :)

import WebNavigator from '../web/web_navigator';
import { Platform } from 'react-native';

const dummyNavigator = {
  navigate: (where: string) => {
    console.log('TODO:Replace dummy navigator');
  },
};

const Navigator = Platform.OS === 'web' ? WebNavigator.getInst() : dummyNavigator;

export { Navigator };
