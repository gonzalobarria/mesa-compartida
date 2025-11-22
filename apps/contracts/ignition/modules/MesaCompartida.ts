import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MesaCompartidaModule", (m) => {
  const plateNFT = m.contract("PlateNFT");

  const mesaCompartida = m.contract("MesaCompartida", [plateNFT]);

  return { plateNFT, mesaCompartida };
});
