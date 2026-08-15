import {
	isToolCallEventType,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { findOutsideDelete } from "./guard";

export default function cwdDeleteGuard(pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return undefined;

		const reason = await findOutsideDelete(event.input.command, ctx.cwd);
		if (!reason) return undefined;

		if (ctx.hasUI) ctx.ui.notify(`Blocked delete: ${reason}`, "warning");
		return { block: true, reason: `CWD delete guard: ${reason}` };
	});
}
