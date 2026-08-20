import { Badge } from './ui/Badge';

interface AvailabilityLabelProps {
  availableSpots: number;
  lowThreshold?: number;
}

export function AvailabilityLabel({ availableSpots, lowThreshold = 3 }: AvailabilityLabelProps) {
  if (availableSpots < 1) {
    return (
      <Badge tone="red" dot>
        Unavailable
      </Badge>
    );
  }

  if (availableSpots <= lowThreshold) {
    return (
      <Badge tone="amber" dot>
        Last {availableSpots} spot{availableSpots === 1 ? '' : 's'}
      </Badge>
    );
  }

  return (
    <Badge tone="green" dot>
      {availableSpots} spots available
    </Badge>
  );
}
