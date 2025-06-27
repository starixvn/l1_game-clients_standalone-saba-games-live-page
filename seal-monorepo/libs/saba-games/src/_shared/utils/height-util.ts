/**
 * 高度获取工具函数
 * 提供多种方式获取元素在画面上实际的高度
 */

export interface ElementHeightInfo {
  offsetHeight: number;    // 包含边框和内边距的总高度
  clientHeight: number;    // 包含内边距但不包含边框的高度
  scrollHeight: number;    // 包含内边距和溢出内容的总高度
  getBoundingClientRect: number; // 通过 getBoundingClientRect 获取的高度
}

/**
 * 通过元素ID获取元素的实际高度
 * @param elementId 元素的ID
 * @returns 元素高度信息对象，如果元素不存在则返回 null
 */
export function getElementHeightById(elementId: string): ElementHeightInfo | null {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return null;
  }
  
  return getElementHeight(element);
}

/**
 * 通过CSS选择器获取元素的实际高度
 * @param selector CSS选择器
 * @returns 元素高度信息对象，如果元素不存在则返回 null
 */
export function getElementHeightBySelector(selector: string): ElementHeightInfo | null {
  const element = document.querySelector(selector) as HTMLElement;
  
  if (!element) {
    console.warn(`Element with selector "${selector}" not found`);
    return null;
  }
  
  return getElementHeight(element);
}

/**
 * 获取元素的实际高度信息
 * @param element HTML元素
 * @returns 元素高度信息对象
 */
export function getElementHeight(element: HTMLElement): ElementHeightInfo {
  const rect = element.getBoundingClientRect();
  
  return {
    offsetHeight: element.offsetHeight,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    getBoundingClientRect: rect.height
  };
}

/**
 * 获取元素的总高度（包含边框和内边距）
 * @param elementId 元素的ID
 * @returns 总高度，如果元素不存在则返回 0
 */
export function getElementTotalHeight(elementId: string): number {
  const heightInfo = getElementHeightById(elementId);
  return heightInfo?.offsetHeight || 0;
}

/**
 * 获取元素的内容高度（不包含边框）
 * @param elementId 元素的ID
 * @returns 内容高度，如果元素不存在则返回 0
 */
export function getElementContentHeight(elementId: string): number {
  const heightInfo = getElementHeightById(elementId);
  return heightInfo?.clientHeight || 0;
}

/**
 * 获取元素的滚动高度（包含溢出内容）
 * @param elementId 元素的ID
 * @returns 滚动高度，如果元素不存在则返回 0
 */
export function getElementScrollHeight(elementId: string): number {
  const heightInfo = getElementHeightById(elementId);
  return heightInfo?.scrollHeight || 0;
}

/**
 * 获取元素相对于视口的高度
 * @param elementId 元素的ID
 * @returns 相对视口的高度，如果元素不存在则返回 0
 */
export function getElementBoundingHeight(elementId: string): number {
  const heightInfo = getElementHeightById(elementId);
  return heightInfo?.getBoundingClientRect || 0;
}

/**
 * 等待元素出现后获取其高度
 * @param elementId 元素的ID
 * @param timeout 超时时间（毫秒），默认 5000ms
 * @returns Promise<ElementHeightInfo | null>
 */
export function waitForElementAndGetHeight(
  elementId: string, 
  timeout: number = 5000
): Promise<ElementHeightInfo | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.getElementById(elementId);
      
      if (element) {
        resolve(getElementHeight(element));
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        console.warn(`Element with id "${elementId}" not found within ${timeout}ms`);
        resolve(null);
        return;
      }
      
      requestAnimationFrame(checkElement);
    };
    
    checkElement();
  });
}
