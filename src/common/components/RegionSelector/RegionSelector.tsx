import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRegionList } from "@/features/user/hooks/useGetLocation";
import { useMemo } from "react";

interface RegionSelectorProps {
  country: string;
  city: string;
  onChange: (country: string, city: string) => void;
}
export default function RegionSelector(props: RegionSelectorProps) {
  const { onChange, country, city } = props;
  const { data: regionList, regionMap } = useGetRegionList();

  const cities = useMemo(
    () => (country ? regionMap[country] : []),
    [country, regionMap]
  );

  const handleChangeCountry = (value: string) => {
    onChange(value, "");
  };
  const handleChangeCity = (value: string) => {
    onChange(country, value);
  };

  return (
    <div className="flex flex-row gap-2 items-center">
      <Select value={country} onValueChange={handleChangeCountry}>
        <SelectTrigger>
          <SelectValue placeholder="국가 선택" />
        </SelectTrigger>
        <SelectContent position="popper">
          {regionList?.map((region) => (
            <SelectItem key={region.country} value={region.country}>
              {region.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={city} onValueChange={handleChangeCity}>
        <SelectTrigger>
          <SelectValue placeholder="도시 선택" />
        </SelectTrigger>
        <SelectContent position="popper">
          {cities?.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
