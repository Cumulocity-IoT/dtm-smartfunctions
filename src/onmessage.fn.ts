import { Measurement, OnMessageFn } from "../dtm";

export const onMessage: OnMessageFn<Measurement> = (obj, context) => {
  if (typeof obj !== "object" || obj == null) {
    throw new Error(`Invalid measurement input: ${JSON.stringify(obj)}`);
  }

  if (obj.cumulocityType !== "measurement") {
    return null;
  }

  const measurement = obj.payload;
  if (!measurement) {
    throw new Error("Measurement payload is null or empty.");
  }

  const { linkedAsset } = context;
  if (
    linkedAsset == null ||
    !Array.isArray(linkedAsset) ||
    linkedAsset.length === 0
  ) {
    console.debug(`No or empty linked asset in context, skipping measurement.`);
    return null;
  }

  const results: Measurement[] = [];
  const validLinkedAssets = linkedAsset.filter((link) => {
    if (link?.asset != null && link?.fragment != null && link?.series != null) {
      return true;
    } else {
      console.debug(
        `Skipping linked asset ${JSON.stringify(link)}. Fields asset, fragment, and series must not be null.`,
      );
    }
    return false;
  });

  let assetId = context.linkedAssetId;
  const splitFragmentSeries = context.params?.splitFragmentSeries ?? true;

  // create a separate measurement for each linked asset, fragment, and series combination
  if (splitFragmentSeries === true) {
    for (const link of validLinkedAssets) {
      const fragment = measurement[link.fragment];
      const seriesValue = fragment?.[link.series];
      if (!seriesValue) {
        throw new Error(
          `Fragment ${link.fragment} or series ${link.series} not found in measurement`,
        );
      }

      const { value, unit } = seriesValue;
      const { asset } = link;
      const result: Measurement = {
        payload: {
          source: { id: asset.id },
          type: measurement.type,
          time: measurement.time,
          [link.asset.fragment]: {
            [link.asset.series]: {
              value,
              unit,
            },
          },
        },
        cumulocityType: "measurement",
        destination: "cumulocity",
      };
      results.push(result);
    }
    // create one measurement with all fragments/series for the asset
  } else {
    const fragments: any = {};
    for (const assetLink of validLinkedAssets) {
      const fragment = measurement[assetLink.fragment];
      const seriesValue = fragment?.[assetLink.series];

      if (!seriesValue) {
        throw new Error(
          `Fragment ${assetLink.fragment} or series ${assetLink.series} not found in measurement`,
        );
      }
      fragments[assetLink.asset.fragment] = {
        ...fragments[assetLink.asset.fragment],
        ...{
          [assetLink.asset.series]: {
            value: seriesValue.value,
            unit: seriesValue.unit,
          },
        },
      };
    }

    const uniqueAssetIds = new Set(
      validLinkedAssets.map((link) => link.asset.id),
    );
    if (uniqueAssetIds.size > 1) {
      console.warn(
        `Multiple unique asset IDs found in linked assets: ${Array.from(
          uniqueAssetIds,
        ).join(", ")}.`,
      );
    }
    assetId = uniqueAssetIds.size > 0 ? Array.from(uniqueAssetIds)[0] : assetId;
    if (!assetId) {
      console.debug(
        `No valid asset ID found in linkedAsset, skipping measurement processing.`,
      );
      return null;
    }

    results.push({
      payload: {
        source: { id: assetId },
        type: measurement.type,
        time: measurement.time,
        ...fragments,
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    });
  }

  console.debug(
    `New measurement(s) for asset ${assetId}: with value: ${JSON.stringify(results)}`,
  );

  return results.length > 0 ? results : null;
};
