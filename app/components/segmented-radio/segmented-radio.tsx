import { RadioGroup } from "@headlessui/react";
import clsx from "clsx";
import { useControlField } from "remix-validated-form";

type Props = {
  name: string;
  options?: Option[];
};

type Option = { value: string; label: React.ReactNode };

export function SegmentedRadio({
  value,
  onChange,
  ...props
}: Props & { value: string; onChange: (value: string) => void }) {
  return (
    <RadioGroup value={value} onChange={onChange} name={props.name}>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {props.options?.map((option) => (
          <RadioGroup.Option
            key={option.value}
            value={option.value}
            className={({ checked }) =>
              clsx(checked ? "bg-[#EDEDED]" : "bg-white", "border-2 rounded-md py-3 px-10 cursor-pointer")
            }
          >
            {option.label}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}

export function ValidatedSegmentedRadio(props: Props) {
  const [value, setValue] = useControlField<string>(props.name);
  return <SegmentedRadio value={value} onChange={setValue} {...props} />;
}
