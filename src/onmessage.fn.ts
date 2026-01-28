import { Measurement, DtmContext } from '../dtm';

export function onMessage(
  obj: Measurement,
  context: DtmContext,
): Measurement | Measurement[] | null {
  if (typeof obj !== 'object' || obj == null) {
    throw new Error(`Invalid measurement input: ${JSON.stringify(obj)}`);
  }

  if (obj.cumulocityType !== 'measurement') {
    return null;
  }

  const measurement = obj.payload;
  const { linkedAsset, console } = context;
  if (linkedAsset == null) {
    console.debug(
      `No linked asset in context, skipping measurement processing.`,
    );
    return null;
  }

  if (
    linkedAsset?.asset == null ||
    linkedAsset?.fragment == null ||
    linkedAsset?.series == null
  ) {
    console.debug(
      `Skipping measurement processing for ${JSON.stringify(linkedAsset)}. fragment, series, and asset required.`,
    );
    return null;
  }

  const fragment = measurement[linkedAsset.fragment];
  const seriesValue = fragment?.[linkedAsset.series];
  if (!seriesValue) {
    throw new Error(
      `Fragment ${linkedAsset.fragment} or series ${linkedAsset.series} not found in measurement`,
    );
  }

  const { value, unit } = seriesValue;
  const { asset } = linkedAsset;

  const result: Measurement = {
    payload: {
      source: { id: asset.id },
      type: measurement.type,
      time: measurement.time,
      [linkedAsset.asset.fragment]: {
        [linkedAsset.asset.series]: {
          value,
          unit,
        },
      },
    },
    cumulocityType: 'measurement',
    destination: 'cumulocity',
  };

  console.debug(
    `Created persistent measurement for asset ${asset.id} with value: ${JSON.stringify(result.payload)}`,
  );

  return result;
}
