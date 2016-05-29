// Copyright 2014, 2016 Kevin Reid <kpreid@switchb.org>
// 
// This file is part of ShinySDR.
// 
// ShinySDR is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// ShinySDR is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with ShinySDR.  If not, see <http://www.gnu.org/licenses/>.

// TODO: remove network module depenency
require.config({
  baseUrl: '/client/'
});
define(['values', 'events', 'widget', 'widgets', 'network', 'database', 'coordination'], function (values, events, widget, widgets, network, database, coordination) {
  'use strict';

  var ClientStateObject = coordination.ClientStateObject;
  var ConstantCell = values.ConstantCell;
  var StorageCell = values.StorageCell;
  var StorageNamespace = values.StorageNamespace;
  var makeBlock = values.makeBlock;
  
  var binCount = 4096;
  var sampleRate = 1e6;
  var minLevel = -130;
  var maxLevel = -20;
  
  var scheduler = new events.Scheduler();

  // don't want any persistent state, so fake it with sessionStorage
  var clientStateStorage = new StorageNamespace(sessionStorage, 'shinysdr.client.');
  var clientState = new ClientStateObject(clientStateStorage, null);
  
  var fftcell = new network.BulkDataCell('<dummy spectrum>', new values.BulkDataType('dff', 'b'));
  var root = new ConstantCell(values.block, makeBlock({
    source: new ConstantCell(values.block, makeBlock({
      freq: new ConstantCell(Number, 0),
    })),
    receivers: new ConstantCell(values.block, makeBlock({})),
    client: new ConstantCell(values.block, clientState),
    monitor: new ConstantCell(values.block, makeBlock({
      fft: fftcell,
      freq_resolution: new ConstantCell(Number, binCount),
      signal_type: new ConstantCell(values.any, {kind: 'IQ', sample_rate: sampleRate})
    }))
  }));
  
  var context = new widget.Context({
    widgets: widgets,
    radioCell: root,  // TODO: 'radio' name is bogus
    clientState: clientState,
    spectrumView: null,
    freqDB: new database.Union(),
    scheduler: scheduler
  });
  
  var buffer = new ArrayBuffer(4+8+4+4 + binCount * 1);
  var dv = new DataView(buffer);
  dv.setFloat64(4, 0, true); // freq
  dv.setFloat32(4+8, sampleRate, true);
  dv.setFloat32(4+8+4, -128 - minLevel, true); // offset
  var bytearray = new Int8Array(buffer, 4+8+4+4, binCount);
  var amplitudes = new Float32Array(binCount);
  
  //var frameCount = 0;
  function updateFFT() {
    //frameCount++;
    for (var i = 0; i < binCount; i++) {
      amplitudes[i] = Math.random();
    }
    for (var i = 0; i < binCount; i++) {
      var ampl = amplitudes[i];
      var scaledLog = Math.max(-128, Math.log10(ampl) * 10 - 100);
      bytearray[i] = scaledLog;
    }
    fftcell._update(buffer);
  }
  
  function loop() {
    if (document.body.offsetWidth < document.documentElement.offsetWidth) {  // visibility check
      updateFFT();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  
  widget.createWidgets(root, context, document);
});