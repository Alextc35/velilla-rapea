export async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar el audio: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return audioContext.decodeAudioData(arrayBuffer);
}