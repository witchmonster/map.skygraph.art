import { FC, Fragment, Dispatch, SetStateAction } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { getPickerLanguages, getLanguageName } from "../common/translation";
import { SetURLSearchParams } from 'react-router-dom';

interface LanguagePickerProps {
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
    currentLanguage: string;
    setCurrentLanguage: Dispatch<SetStateAction<string>>;
}

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

function buildMenu(
    searchParams: URLSearchParams,
    setSearchParams: SetURLSearchParams,
    currentLanguage: string,
    setCurrentLanguage: Dispatch<SetStateAction<string>>
) {
    const menuItems: any[] = [];
    getPickerLanguages()
        .filter(language => language.lang !== currentLanguage)
        .forEach(language => menuItems.push(
            <Menu.Item key={language.lang}>
                {({ active }) => (
                    <a
                        className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-2 py-1 text-xs'
                        )}
                        onClick={() => {
                            setCurrentLanguage(language.lang)
                            searchParams.set('lang', language.lang);
                            setSearchParams(searchParams);
                        }}
                    >
                        {language.name}
                    </a>

                )}
            </Menu.Item>
        ));
    return menuItems;
}

const LanguagePicker: FC<LanguagePickerProps> = ({
    searchParams,
    setSearchParams,
    currentLanguage,
    setCurrentLanguage }) => {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute cursor-pointer bottom-6 left-0 z-10 mt-1 w-[6rem] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-0.5">
                        {buildMenu(searchParams, setSearchParams, currentLanguage, setCurrentLanguage)}
                    </div>
                </Menu.Items>
            </Transition>
            <div>
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white mt-1 px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    {getLanguageName(currentLanguage)}
                    <ChevronDownIcon className="-mr-1 -ml-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                </Menu.Button>
            </div>
        </Menu>
    )
}

export default LanguagePicker;