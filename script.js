let modelReady = false;
const model = new mm.OnsetsAndFrames(
  "https://storage.googleapis.com/magentadata/js/checkpoints/transcription/onsets_frames_uni"
);

const readUploadedFileAsText = (inputFile) => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};

async function transcribeFiles(fileList) {
  for (let i = 0; i < fileList.length; ++i) {
    const name = fileList[i].name;
    console.log("Transcribing " + name + " ...");
    const basename = name.split(".")[0];
    const ext = name.split(".").pop();
    const outputFp = basename + ".mid";

    if (ext === "json") {
      const text = await readUploadedFileAsText(fileList[i]);
      const melSpec = JSON.parse(text);
      await model.transcribeFromMelSpec(melSpec).then(ns => {
        console.log("Done! " + ns.notes.length + " notes");
        saveAs(new File([mm.sequenceProtoToMidi(ns)], outputFp));
      });
    } else {
      await model.transcribeFromAudioFile(fileList[i]).then(ns => {
        console.log("Done! " + ns.notes.length + " notes");
        saveAs(new File([mm.sequenceProtoToMidi(ns)], outputFp));
      });
    }
  }
}

function initUi() {
  const fileInput = document.getElementById("file-input");

  fileInput.addEventListener("change", function(e) {
    transcribeFiles(fileInput.files);
  });

  document.getElementById("loading").style.display = "none";
  document.getElementById("loaded").style.display = "block";
}

model.initialize().then(() => {
  modelReady = true;
  initUi();
  console.log("Ready to transcribe.");
});
