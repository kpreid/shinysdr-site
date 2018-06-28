// Copyright 2014, 2016, 2017 Kevin Reid <kpreid@switchb.org>
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
  baseUrl: 'client/'
});
define(['types', 'values', 'events', 'widget', 'widgets', 'network', 'database', 'coordination'],
       (types, values, events, widget, widgets, network, database, coordination) => {
  'use strict';
  
  const {
    BulkDataT,
    anyT,
    blockT,
    numberT,
  } = types;
  const {
    ClientStateObject,
  } = coordination;
  const {
    ConstantCell,
    FakeBulkDataCell,
    StorageCell,
    StorageNamespace,
    makeBlock,
  } = values;
  
  var binCount = 2048;
  var sampleRate = 1e6;
  var minLevel = -130;
  
  var scheduler = new events.Scheduler();

  // don't want any persistent state, so fake it with sessionStorage
  var clientStateStorage = new StorageNamespace(sessionStorage, 'shinysdr.client.');
  var clientState = new ClientStateObject(clientStateStorage, null);
  
  const fakeInfo = {freq: 0, rate: sampleRate};
  var fftcell = new FakeBulkDataCell(new BulkDataT('dff', 'b'), [fakeInfo, []]);
  var root = new ConstantCell(makeBlock({
    source: new ConstantCell(makeBlock({
      freq: new ConstantCell(0),
    })),
    receivers: new ConstantCell(makeBlock({})),
    client: new ConstantCell(clientState),
    monitor: new ConstantCell(makeBlock({
      fft: fftcell,
      freq_resolution: new ConstantCell(binCount),
      signal_type: new ConstantCell({kind: 'IQ', sample_rate: sampleRate}, anyT)
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
  
  var amplitudes = new Float32Array(binCount);
  var logs = new Float32Array(binCount);
  
  const noiseFloorAmplitude = 1e-10;
  
  // simulated signal state
  var t = 0;
  var burstFreq = [0, 0, 0, 0];
  var burstAmp = [0, 0, 0, 0];
  
  function addSignal(freq, amplitude) {
    var bin = freq * binCount;
    bin = (bin % binCount + binCount) % binCount;
    for (var i = Math.round(bin - 5); i < Math.round(bin + 5); i++) {
      amplitudes[i] += Math.max(0, amplitude * (1 - Math.abs(i - bin) * 0.3));
    }
  }
  
  function updateFFT() {
    t++;
    var burstChange = Math.floor(Math.random() * burstFreq.length * 10);
    if (burstChange < burstFreq.length) {
      burstFreq[burstChange] = Math.random();
      burstAmp[burstChange] = noiseFloorAmplitude * Math.pow(10, Math.random() * 6);
    }
    
    for (var i = 0; i < binCount; i++) {
      amplitudes[i] = Math.random() * noiseFloorAmplitude;
    }
    addSignal(0.2 + t / 1000, noiseFloorAmplitude * 100);  // chirp
    addSignal(0.48 + 0.002 * Math.sin(t * 0.8), noiseFloorAmplitude * 100);  // FM
    for (var i = 0; i < burstFreq.length; i++) {
      addSignal(burstFreq[i], burstAmp[i]);
    }
    for (var i = 0; i < binCount; i++) {
      logs[i] = (Math.log10(amplitudes[i]) * 10);
    }
    fftcell._update([fakeInfo, logs]);
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