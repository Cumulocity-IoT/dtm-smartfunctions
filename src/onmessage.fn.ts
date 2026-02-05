import { Measurement, OnMessageFn } from "../dtm";

export const onMessage: OnMessageFn<Measurement> = (obj, context) => {
  if (typeof obj !== "object" || obj == null) {
    throw new Error(`Invalid measurement input: ${JSON.stringify(obj)}`);
  }

  if (obj.cumulocityType !== "measurement") {
    return null;
  }

  const measurement = obj.payload;
  const { linkedAsset } = context;
  if (linkedAsset == null) {
    console.debug(
      `No linked asset in context, skipping measurement processing.`,
    );
    return null;
  }

  if (!Array.isArray(linkedAsset)) {
    console.debug(
      `linkedAsset in context is not an array, skipping measurement processing.`,
    );
    return null;
  }

  const results: Measurement[] = [];
  for (const assetLink of linkedAsset) {
    if (
      assetLink?.asset == null ||
      assetLink?.fragment == null ||
      assetLink?.series == null
    ) {
      console.debug(
        `Skipping measurement processing for ${JSON.stringify(assetLink)}. fragment, series, and asset required.`,
      );
      continue;
    }

    const fragment = measurement[assetLink.fragment];
    const seriesValue = fragment?.[assetLink.series];
    if (!seriesValue) {
      throw new Error(
        `Fragment ${assetLink.fragment} or series ${assetLink.series} not found in measurement`,
      );
    }

    const { value, unit } = seriesValue;
    const { asset } = assetLink;

    const result: Measurement = {
      payload: {
        source: { id: asset.id },
        type: measurement.type,
        time: measurement.time,
        [assetLink.asset.fragment]: {
          [assetLink.asset.series]: {
            value,
            unit,
          },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };
    console.debug(
      `Created persistent measurement for asset ${asset.id} with value: ${JSON.stringify(result.payload)}`,
    );
    results.push(result);
  }

  return results;
};
