'use babel';

import {
  CompositeDisposable
} from 'atom';

//Importing it the regular way doesn't work. I don't know why.
const NotificationManager = atom.notifications;
const PackageManager = atom.packages;
const Workspace = atom.workspace;

import {
  TouchBar
} from 'remote';

const hasTouchBar = TouchBar ? true : false;

export default {

  touchBarUtilityView: null,
  modalPanel: null,
  subscriptions: null,

  config: {
    buttons: {
      title: 'Buttons',
      description: 'Here you must specify the buttons that you want appearing on your Touch Bar. If you don\' know how, follow the instructions in below (or in the README.md file).',
      type: 'string',
      default: 'atom-beautify:beautify-editor|Beautify Editor'
    }
  },

  activate(state) {

    atom.commands.add('atom-workspace', {
      'touch-bar-utility:toot': () => this.toot()
    })

    clog('activated');
    clog('Has Touch Bar: ' + hasTouchBar);
    if (TouchBar) {
      const {
        TouchBarLabel,
        TouchBarButton,
        TouchBarSpacer
      } = TouchBar;

      let config = atom.config.get('touch-bar-utility.buttons').split(';').clean('');

      let arrayOfButtons = [];

      let first = true;

      config.forEach(function(packageAction) {
        let firstSplit = packageAction.split(':');
        let secondSplit = firstSplit[1].split('|');
        let buttonLabel = secondSplit[1];

        if (secondSplit[1] === undefined || secondSplit[1] == '') {
          buttonLabel = secondSplit[1].split('-').map(function(word) {
            return word.charAt(0).toUpperCase() + word.substr(1);
          });
        } else {
          buttonLabel = secondSplit[1];
        }

        let jsonButton = {
          packageName: firstSplit[0],
          eventName: secondSplit[0],
          buttonLabel: buttonLabel
        }

        button = new TouchBarButton({
          label: jsonButton.buttonLabel,
          click: () => {
            dispatchAction(jsonButton.packageName, jsonButton.eventName)
          }
        });

        if (!first) {
          arrayOfButtons.push(new TouchBarSpacer({
            size: 'small'
          }));
        }

        arrayOfButtons.push(button);

        first = false;
      });

      let touchBar = new TouchBar(arrayOfButtons);

      atom.getCurrentWindow().setTouchBar(touchBar);
    } else {
      NotificationManager.addError('This computer does not have a Touch Bar 🙁', {
        dismissable: true,
        description: "<h2><strong>Solution</strong></h2>If you are running macOS, but don't have a Touch Bar, you can install the [Touch Bar Simulator <img src=\"https://sindresorhus.com/touch-bar-simulator/assets/images/logo.png\" width=\"100\">](https://sindresorhus.com/touch-bar-simulator/)<br><strong>At least the TOOT function works 😌</strong>"
      });
    }
  },

  deactivate() {

  },

  serialize() {

  },

  toot() {
    clog('TOOT');
    let first = true;
    let notification = NotificationManager.addInfo('TOOT TOOT', {
      buttons: [{
        className: 'btn btn-success',
        onDidClick: function() {
          notification.dismiss();
          if (first) {
            NotificationManager.addInfo('Roger that');
            dispatchAction('atom-beautify', 'beautify-editor');
            first = false;
          }
        },
        text: 'TOOT'
      }]
    });
  }

};

function dispatchAction(atomPackage, packageEvent) {
  console.log('------------------------------------');
  clog(atomPackage);
  clog('Available: ' + PackageManager.getAvailablePackageNames().includes(atomPackage));
  clog('Enabled: ' + !PackageManager.isPackageDisabled(atomPackage));
  clog('Loaded: ' + PackageManager.isPackageLoaded(atomPackage));
  clog('Activated: ' + PackageManager.isPackageActive(atomPackage));

  if (!PackageManager.getAvailablePackageNames().includes(atomPackage)) {
    NotificationManager.addError("The package '" + atomPackage + "' is not installed", {
      dismissable: true,
      description: "Please install it by going to File → Settings → Install and restart Atom"
    });
  } else if (PackageManager.isPackageDisabled(atomPackage)) {
    NotificationManager.addError("The package '" + atomPackage + "' is not enabled", {
      dismissable: true,
      description: "Please enable it by going to to File → Settings → Packages and clicking the Enable button that corresponds to '" + atomPackage + "' and restart Atom"
    });
  } else {
    if (!PackageManager.isPackageLoaded(atomPackage) || !PackageManager.isPackageActive(atomPackage)) {
      NotificationManager.addError("The package '" + atomPackage + "' is not loaded or activated", {
        dismissable: true,
        description: "Please activate it by going to to Packages → " + atomPackage + " and clicking in any of the side options. From that point forward, the TouchBar Beautify function will work"
      });
    }

    // Beautify file
    PackageManager.activatePackage(atomPackage).then(function(value) {
      clog(atomPackage + ':' + packageEvent + ' event dispatched');
      atom.commands.dispatch(atom.views.getView(atom.workspace), atomPackage + ":" + packageEvent);
    }, function(reason) {
      NotificationManager.addFatalError("The package '" + atomPackage + "' did not activate correctly", {
        dismissable: true,
        detail: reason
      });
    });
  }
}

function clog(message) {
  console.log({
    package: 'touch-bar-utility',
    message: message
  });
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
