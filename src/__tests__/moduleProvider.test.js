/***************************************************************************************
 * (c) 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

'use strict';

describe('moduleProvider', function() {
  var logger;
  var injectModuleProvider = require('inject-loader!../moduleProvider');
  var referencePath = 'hello-world/src/foo.js';
  var displayName = 'Foo';
  var moduleExports = {};
  var extractModuleExports = require('../extractModuleExports');
  var extractModuleExportsSpy;
  var moduleProvider;

  beforeEach(function() {
    logger = jasmine.createSpyObj('logger', ['log', 'error']);
    extractModuleExportsSpy = jasmine.createSpy('m').and.callFake(extractModuleExports);

    moduleProvider = injectModuleProvider({
      './logger': logger,
      './extractModuleExports': extractModuleExportsSpy
    });

    var module = {
      displayName: displayName,
      script: function(module) {
        module.exports = moduleExports;
      }
    };

    var require = function(path) { return path; };

    moduleProvider.registerModule(referencePath, module, require);
  });

  it('does not attempt to extract the module export when only registering a module', function() {
    expect(extractModuleExportsSpy.calls.count()).toBe(0);
  });

  it('hydrates cache', function() {
    moduleProvider.hydrateCache();
    expect(extractModuleExportsSpy.calls.count()).toBe(1);
    moduleProvider.getModuleExports(referencePath);
    expect(extractModuleExportsSpy.calls.count()).toBe(1);
  });

  it('logs an error if error is thrown while hydrating cache', function() {
    moduleProvider.registerModule(
      referencePath,
      {
        displayName: 'Foo',
        script: function() {
          throw new Error('noob tried to divide by zero.');
        }
      }
    );

    moduleProvider.hydrateCache();

    var errorMessage = logger.error.calls.mostRecent().args[0];
    expect(errorMessage).toStartWith('Error initializing module ' + referencePath +
      '. noob tried to divide by zero.');
  });

  it('returns module exports', function() {
    expect(moduleProvider.getModuleExports(referencePath)).toBe(moduleExports);
  });

  it('returns display name', function() {
    expect(moduleProvider.getModuleDisplayName(referencePath)).toBe('Foo');
  });

  it('throws an error when a module is not found', function() {
    expect(function() {
      moduleProvider.getModuleExports('hello-world/src/invalid.js');
    }).toThrowError('Module hello-world/src/invalid.js not found.');
  });
});
