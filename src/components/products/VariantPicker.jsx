import { useEffect, useMemo, useState } from 'react';

/** Size / colour selection over a product's variants. Calls onChange(variant|null). */
export function useVariantSelection(product) {
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    if (!product) return;
    const firstInStock = product.variants.find((v) => v.stock > 0) || product.variants[0];
    setColor(product.colors.length ? firstInStock?.color : null);
    setSize(product.sizes.length === 1 ? product.sizes[0] : null);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const variant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => (!product.colors.length || v.color === color) && (!product.sizes.length || v.size === size)) || null;
  }, [product, color, size]);

  return { color, setColor, size, setSize, variant, needsSize: product?.sizes.length > 0 && !size };
}

export default function VariantPicker({ product, sel, error }) {
  const { color, setColor, size, setSize } = sel;
  const stockFor = (c, s) =>
    product.variants.filter((v) => (c == null || v.color === c) && (s == null || v.size === s)).reduce((n, v) => n + v.stock, 0);

  return (
    <div className="space-y-5">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Colour: <span className="font-normal text-gray-600">{color}</span></legend>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const out = stockFor(c, null) === 0;
              return (
                <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={color === c}
                  className={`h-10 rounded-md border px-4 text-sm transition ${color === c ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line hover:border-ink'} ${out ? 'text-gray-400 line-through' : ''}`}>
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {product.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Size{size && <span className="font-normal text-gray-600">: {size}</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const out = stockFor(product.colors.length ? color : null, s) === 0;
              return (
                <button key={s} type="button" onClick={() => !out && setSize(s)} disabled={out} aria-pressed={size === s}
                  className={`h-10 min-w-[48px] rounded-md border px-3 text-sm font-medium transition ${size === s ? 'border-brand bg-brand text-white' : 'border-line hover:border-ink'} disabled:cursor-not-allowed disabled:bg-mist disabled:text-gray-300 disabled:line-through`}>
                  {s}
                </button>
              );
            })}
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
        </fieldset>
      )}
    </div>
  );
}
