import type { VirtualKey } from "@/lib/types/governance";

/** The team, business unit, customer or user a virtual key belongs to, as the access tab names it. */
export interface VirtualKeyOwner {
	kind: "team" | "business unit" | "customer" | "user";
	name: string;
}

/**
 * Who a virtual key belongs to, so granting it access to a Virtual MCP can say whose key it is first:
 * the team, business unit or customer that owns it, or the user it is assigned to. A key has at most
 * one; a name falls back to the id (or a user's email) when it was not loaded with the key.
 */
export function virtualKeyOwner(
	vk:
		| Pick<VirtualKey, "team_id" | "team" | "business_unit_id" | "business_unit" | "customer_id" | "customer" | "assigned_user">
		| null
		| undefined,
): VirtualKeyOwner | undefined {
	if (vk?.team_id) return { kind: "team", name: vk.team?.name || vk.team_id };
	if (vk?.business_unit_id) return { kind: "business unit", name: vk.business_unit?.name || vk.business_unit_id };
	if (vk?.customer_id) return { kind: "customer", name: vk.customer?.name || vk.customer_id };
	if (vk?.assigned_user) return { kind: "user", name: vk.assigned_user.name || vk.assigned_user.email || vk.assigned_user.id };
	return undefined;
}
/** What picking a key for a Virtual MCP leads to: confirm whose key it is, assign it, or retry. */
export type PickedVirtualKey = { outcome: "owned"; owner: VirtualKeyOwner } | { outcome: "unowned" } | { outcome: "lookupFailed" };

/**
 * Decides what picking a key leads to. A key the tab already listed is answered from that; one past
 * the listed page is read with fetchKey to find its owner. A failed read is reported as such rather
 * than read as an unowned key, since that would assign another entity's key without the confirmation.
 */
export async function resolvePickedVirtualKey(
	listed: Parameters<typeof virtualKeyOwner>[0],
	fetchKey: () => Promise<Parameters<typeof virtualKeyOwner>[0]>,
): Promise<PickedVirtualKey> {
	let vk = listed;
	if (!vk) {
		try {
			vk = await fetchKey();
		} catch {
			return { outcome: "lookupFailed" };
		}
	}
	const owner = virtualKeyOwner(vk);
	return owner ? { outcome: "owned", owner } : { outcome: "unowned" };
}