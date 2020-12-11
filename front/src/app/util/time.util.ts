export function timeToMinutes(time: string, separator?: string): number {
	separator = separator || ':';
	const splittedTime = time.split(separator);
	return parseInt(splittedTime[0], 10) * 60 + parseInt(splittedTime[1], 10);
}

export function timeToSeconds(time: string, separator?: string): number {
	return 60 * timeToMinutes(time, separator);
}

export function formatMinutes(minutes: number): string {
	const hours = Math.trunc(minutes / 60);
	const remains = minutes % 60;
	if (minutes >= 0) {
		const fHours = hours > 9 ? hours.toString() : '0' + hours;
		const fRemains = remains > 9 ? remains.toString() : '0' + remains;
		return fHours + ':' + fRemains;
	}
	return formatMinutes(1440 + minutes);
}