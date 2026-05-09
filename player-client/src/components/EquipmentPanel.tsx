interface Props {
  equipment: Array<{ name: string; quantity: number; description?: string }>;
}

export default function EquipmentPanel({ equipment }: Props) {
  return (
    <div className="player-equipment">
      <h4>装备与物品</h4>
      {equipment && equipment.length > 0 ? (
        <ul className="player-item-list">
          {equipment.map((item, i) => (
            <li key={i}>{item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}</li>
          ))}
        </ul>
      ) : (
        <p className="dm-hint">行囊空空如也。</p>
      )}
    </div>
  );
}
